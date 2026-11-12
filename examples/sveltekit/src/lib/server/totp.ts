import type { Passlock } from '@passlock/server';
import type { TotpStore } from './totpStore';

export class TotpFlowError extends Error {
	constructor(
		public status: number,
		message: string,
		public retryAfterSeconds?: number
	) {
		super(message);
	}
}
const unavailable = () =>
	new TotpFlowError(
		503,
		'Authenticator verification is unavailable. Try again later or use a passkey if you have one.'
	);
const expired = () =>
	new TotpFlowError(401, 'This login has expired or was already used. Start again.');
export type TotpSdk = Pick<
	Passlock,
	| 'createTotpAuthenticator'
	| 'confirmTotpAuthenticator'
	| 'getTotpAuthenticator'
	| 'verifyTotp'
	| 'deleteTotpAuthenticator'
>;
export type TotpActor = { userId: number; sessionId: string; email: string };

const domainError = (failure: { _tag: string; retryAfterSeconds?: number }) => {
	switch (failure._tag) {
		case '@error/BadRequest':
			return new TotpFlowError(
				400,
				'Check the authenticator details and enter the code exactly as shown.'
			);
		case '@error/InvalidTotpCode':
			return new TotpFlowError(
				400,
				'That code was not accepted. Check your device clock and try a fresh code.'
			);
		case '@error/TotpCodeAlreadyUsed':
			return new TotpFlowError(409, 'That code has already been used. Wait for a new code.');
		case '@error/TotpEnrollmentExpired':
			return new TotpFlowError(410, 'Enrollment expired. Remove it and start again.');
		case '@error/TotpAuthenticatorNotActive':
			return new TotpFlowError(
				409,
				'This authenticator has not been confirmed. Check its enrollment status.'
			);
		case '@error/TotpAuthenticatorAlreadyActive':
			return new TotpFlowError(409, 'Enrollment may already be complete. Check its status.');
		case '@error/TotpAuthenticatorLimit':
			return new TotpFlowError(
				409,
				'Authenticator limit reached. Remove an unused enrollment first.'
			);
		case '@error/TotpRateLimited':
			return new TotpFlowError(
				429,
				'Too many attempts. Wait before trying a fresh code.',
				failure.retryAfterSeconds
			);
		case '@error/NotFound':
			return new TotpFlowError(404, 'Authenticator not found for this account.');
		default:
			return unavailable();
	}
};

/** Application policy: email + TOTP, with passkeys as an optional independent sign-in method. */
export const createTotpFlows = ({ store, sdk }: { store: TotpStore; sdk: TotpSdk }) => {
	const owned = async (actor: TotpActor, id: string) => {
		const row = await store.get(actor.userId, id);
		if (!row) throw new TotpFlowError(404, 'Authenticator not found for this account.');
		return row;
	};
	const activate = async (
		actor: TotpActor,
		id: string,
		record: { id: string; userId: string; status: string }
	) => {
		if (record.id !== id || record.userId !== String(actor.userId) || record.status !== 'active')
			throw unavailable();
		if (!(await store.activate(actor.userId, id))) throw unavailable();
	};
	return {
		async enroll(actor: TotpActor, displayName: string) {
			const result = await sdk.createTotpAuthenticator({
				userId: String(actor.userId),
				issuer: 'Passlock example',
				username: actor.email,
				displayName
			});
			if (result.failure) throw domainError(result.error);
			const { authenticator, setup } = result.value;
			if (authenticator.userId !== String(actor.userId)) throw unavailable();
			await store.insert({
				authenticatorId: authenticator.id,
				userId: actor.userId,
				enrollmentSessionId: actor.sessionId,
				status: 'pending',
				displayName: authenticator.displayName ?? displayName,
				digits: authenticator.totp.digits,
				expiresAt: authenticator.expiresAt,
				createdAt: authenticator.createdAt
			});
			// Return setup once. Never persist it, put it in a cookie or return it from a loader.
			return {
				type: 'enrollment' as const,
				authenticatorId: authenticator.id,
				digits: authenticator.totp.digits,
				expiresAt: authenticator.expiresAt,
				setup
			};
		},
		async confirm(actor: TotpActor, id: string, code: string) {
			const row = await owned(actor, id);
			if (row.enrollmentSessionId !== actor.sessionId)
				throw new TotpFlowError(403, 'Confirm enrollment from the session that started it.');
			if (code.length !== row.digits)
				throw new TotpFlowError(400, `Enter the ${row.digits}-digit code exactly as shown.`);
			if (!(await store.claimEnrollment(actor.userId, id, actor.sessionId)))
				throw new TotpFlowError(409, 'Enrollment expired or needs a status check.');
			// An uncertain confirmation requires MFA conservatively until reconciled or removed.
			const result = await sdk.confirmTotpAuthenticator({
				userId: String(actor.userId),
				authenticatorId: id,
				code
			});
			if (result.failure) {
				// Only definitive non-commit failures allow another confirmation attempt.
				if (
					[
						'@error/BadRequest',
						'@error/InvalidTotpCode',
						'@error/TotpCodeAlreadyUsed',
						'@error/TotpRateLimited',
						'@error/TotpEnrollmentExpired'
					].includes(result._tag)
				)
					await store.restoreEnrollment(actor.userId, id);
				throw domainError(result.error);
			}
			await activate(actor, id, result.value.authenticator);
		},
		async reconcile(actor: TotpActor, id: string) {
			const row = await owned(actor, id);
			// Another authenticated session may reconcile metadata, but cannot submit
			// confirmation codes for an enrollment started by another session.
			if (row.status !== 'confirming')
				throw new TotpFlowError(409, 'No uncertain confirmation to check.');
			const result = await sdk.getTotpAuthenticator({
				userId: String(actor.userId),
				authenticatorId: id
			});
			if (result.failure) throw domainError(result.error);
			if (result.value.status !== 'active')
				throw new TotpFlowError(
					409,
					'Confirmation is not complete. Remove this enrollment and start again.'
				);
			await activate(actor, id, result.value);
		},
		async remove(actor: TotpActor, id: string) {
			await owned(actor, id);
			const result = await sdk.deleteTotpAuthenticator({
				userId: String(actor.userId),
				authenticatorId: id
			});
			if (result.failure && result._tag !== '@error/NotFound') throw domainError(result.error);
			// Unknown outcomes never remove the local MFA policy. Known NotFound can be reconciled.
			await store.remove(actor.userId, id);
		},
		/** Verify an existing session without creating a new login or accepting another user's credential. */
		async reauthenticate(actor: TotpActor, id: string, code: string) {
			const row = await owned(actor, id);
			if (row.status !== 'active') throw new TotpFlowError(403, 'Use a confirmed authenticator.');
			if (code.length !== row.digits)
				throw new TotpFlowError(400, `Enter the ${row.digits}-digit code exactly as shown.`);
			const result = await sdk.verifyTotp({
				userId: String(actor.userId),
				authenticatorId: id,
				code
			});
			if (result.failure) throw domainError(result.error);
			if (result.value.userId !== String(actor.userId) || result.value.authenticatorId !== id)
				throw unavailable();
		},
		async verify(token: string, id: string, code: string) {
			const login = await store.claimLogin(token);
			if (!login) throw expired();
			try {
				const credential = await store.get(login.userId, id);
				if (!login.authenticatorIds.includes(id) || !credential || credential.status !== 'active')
					throw new TotpFlowError(403, 'That authenticator is not part of this login.');
				if (code.length !== credential.digits)
					throw new TotpFlowError(
						400,
						`Enter the ${credential.digits}-digit code exactly as shown.`
					);
				const result = await sdk.verifyTotp({
					userId: String(login.userId),
					authenticatorId: id,
					code
				});
				if (result.failure) throw domainError(result.error);
				if (result.value.userId !== String(login.userId) || result.value.authenticatorId !== id)
					throw unavailable();
				const session = await store.finishLogin(token, id);
				if (!session) throw expired();
				return session;
			} catch (error) {
				// Known validation failures may be retried within the original deadline/attempt budget.
				// A timeout or unknown commit outcome invalidates this login; never infer success.
				if (error instanceof TotpFlowError && [400, 409, 429].includes(error.status))
					await store.releaseLogin(token);
				else await store.cancelLogin(token);
				throw error;
			}
		}
	};
};

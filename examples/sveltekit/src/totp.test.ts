import { actions as deleteAccountActions } from './routes/account/delete/+page.server';
import { deleteAccount } from './lib/server/deleteAccount';
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { drizzle } from 'drizzle-orm/libsql';
import { Passlock } from '@passlock/server';
import type { Cookies, RequestEvent } from '@sveltejs/kit';
import { DB_FILE_NAME } from '$app/env/private';
import { dev } from '$app/env';
import database from './lib/server/db';
import { createTotpFlows, TotpFlowError, type TotpSdk } from './lib/server/totp';
import { createTotpStore, PENDING_LOGIN_TTL_MS } from './lib/server/totpStore';
import {
	sessionsTable,
	pendingTotpLoginsTable,
	usersTable,
	passkeysTable,
	totpAuthenticatorsTable
} from './lib/server/dbSchema';
import { deleteUser, validateSessionToken } from './lib/server/repository';
import { readTotpJson, requireTotpActor, totpEndpoint, totpJson } from './lib/server/totpHttp';
import { TotpSubmission } from './lib/shared/totp';
import { handle } from './hooks.server';
import { POST as recover } from './routes/login/passkey/+server';
import { POST as enrollRoute } from './routes/account/totp/enroll/+server';
import { POST as confirmRoute } from './routes/account/totp/confirm/+server';
import { POST as removeRoute } from './routes/account/totp/remove/+server';
import { POST as verifyRoute } from './routes/login/totp/verify/+server';
import { load as accountLoad } from './routes/account/totp/+page.server';
import {
	SESSION_COOKIE_NAME,
	TOTP_LOGIN_COOKIE_NAME,
	setTotpLoginCookie
} from './lib/server/cookies';

// Refuse to touch a developer's database. The test script supplies this explicitly.
assert.equal(DB_FILE_NAME, 'file::memory:');
const id = 'abcdefghijklmno';
const actor = { userId: 1, sessionId: 'enrollment-session', email: 'one@example.test' };
const setup = {
	secret: 'TEST-SETUP-SECRET',
	uri: 'otpauth://test',
	qrCodeDataUrl: 'data:image/png;base64,dGVzdA=='
};
const ok = <T extends object>(value: T) => ({
	...value,
	success: true as const,
	failure: false as const,
	value
});
const fail = <T extends string>(_tag: T, retryAfterSeconds?: number) => ({
	_tag,
	message: 'Test failure',
	failure: true as const,
	success: false as const,
	error: { _tag, message: 'Test failure', retryAfterSeconds }
});

async function fixture(db = drizzle('file::memory:')) {
	await db.$client.executeMultiple(`
    PRAGMA foreign_keys = ON;
    DROP TABLE IF EXISTS pending_totp_logins; DROP TABLE IF EXISTS totp_authenticators;
    DROP TABLE IF EXISTS sessions; DROP TABLE IF EXISTS passkeys; DROP TABLE IF EXISTS users;
    CREATE TABLE users (id INTEGER PRIMARY KEY, email TEXT NOT NULL UNIQUE, givenName TEXT NOT NULL, familyName TEXT NOT NULL, createdAt INTEGER NOT NULL);
    CREATE TABLE sessions (id TEXT PRIMARY KEY, userId INTEGER NOT NULL REFERENCES users(id), secretHash TEXT NOT NULL, lastVerifiedAt INTEGER NOT NULL, passkeyAuthenticatedAt INTEGER, totpAuthenticatedAt INTEGER, createdAt INTEGER NOT NULL);
    CREATE TABLE passkeys (passkeyId TEXT PRIMARY KEY, userId INTEGER NOT NULL REFERENCES users(id), username TEXT, platformName TEXT, platformIcon TEXT, createdAt INTEGER NOT NULL);
    CREATE TABLE totp_authenticators (authenticatorId TEXT PRIMARY KEY, userId INTEGER NOT NULL REFERENCES users(id), enrollmentSessionId TEXT NOT NULL, status TEXT NOT NULL, displayName TEXT NOT NULL, digits INTEGER NOT NULL, expiresAt INTEGER NOT NULL, createdAt INTEGER NOT NULL);
    CREATE TABLE pending_totp_logins (tokenHash TEXT PRIMARY KEY, userId INTEGER NOT NULL UNIQUE REFERENCES users(id), authenticatorIds TEXT NOT NULL, expiresAt INTEGER NOT NULL, attempts INTEGER NOT NULL DEFAULT 0, state TEXT NOT NULL DEFAULT 'ready');
  `);
	await db.insert(usersTable).values(
		[1, 2].map((n) => ({
			id: n,
			email: `${n}@example.test`,
			givenName: 'Example',
			familyName: 'User',
			createdAt: Date.now()
		}))
	);
	let now = Date.now();
	const store = createTotpStore(db, () => now);
	const authenticator = {
		id,
		userId: '1',
		displayName: 'Phone',
		status: 'pending',
		totp: { digits: 6 },
		createdAt: now,
		expiresAt: now + 600_000
	};
	const calls: object[] = [];
	const sdk = {
		createTotpAuthenticator: async (input: object) => {
			calls.push(input);
			return ok({ authenticator, setup });
		},
		confirmTotpAuthenticator: async () =>
			ok({ authenticator: { ...authenticator, status: 'active' } }),
		getTotpAuthenticator: async () => ok({ ...authenticator, status: 'active' }),
		verifyTotp: async (input: object) => {
			calls.push(input);
			return ok({
				_tag: 'TotpVerified' as const,
				verifiedAt: Date.now(),
				userId: '1',
				authenticatorId: id
			});
		},
		deleteTotpAuthenticator: async () => ok({})
	} as unknown as TotpSdk;
	const flows = createTotpFlows({ store, sdk });
	const activate = async () => {
		await flows.enroll(actor, 'Phone');
		await flows.confirm(actor, id, '012345');
	};
	const pending = async () => {
		const login = await store.beginEmailLogin(1);
		assert.equal(login.kind, 'pending');
		return login;
	};
	return {
		db,
		store,
		sdk,
		flows,
		calls,
		activate,
		pending,
		advance: (ms: number) => {
			now += ms;
		}
	};
}
const status = (expected: number) => (error: unknown) =>
	error instanceof TotpFlowError && error.status === expected;

await test('enrollment stores metadata only and confirmation binds the initiating account/session', async () => {
	const f = await fixture();
	const enrollment = await f.flows.enroll(actor, 'Phone');
	assert.deepEqual(enrollment.setup, setup);
	assert.equal((await f.store.get(1, id))?.status, 'pending');
	assert.doesNotMatch(
		JSON.stringify(await f.store.list(1)),
		/TEST-SETUP-SECRET|otpauth|data:image/
	);
	assert.equal((await f.store.beginEmailLogin(1)).kind, 'session');
	await assert.rejects(f.flows.confirm({ ...actor, userId: 2 }, id, '012345'), status(404));
	await assert.rejects(
		f.flows.confirm({ ...actor, sessionId: 'other' }, id, '012345'),
		status(403)
	);
	await f.flows.confirm(actor, id, '012345');
	assert.equal((await f.store.get(1, id))?.status, 'active');
	assert.equal((await f.pending()).kind, 'pending');
});

await test('email + TOTP creates no session until verification, then consumes the login exactly once', async () => {
	const f = await fixture();
	await f.activate();
	const login = await f.pending();
	assert.equal((await f.db.select().from(sessionsTable)).length, 0);
	assert.doesNotMatch(
		JSON.stringify(await f.db.select().from(pendingTotpLoginsTable)),
		new RegExp(login.token)
	);
	const session = await f.flows.verify(login.token, id, '012345');
	assert.equal(session.session.userId, 1);
	assert.equal(session.session.passkeyAuthenticatedAt, null);
	assert.deepEqual(f.calls.at(-1), { userId: '1', authenticatorId: id, code: '012345' });
	assert.equal(await f.store.pending(login.token), undefined);
	await assert.rejects(f.flows.verify(login.token, id, '012345'), status(401));
	assert.equal((await f.db.select().from(sessionsTable)).length, 1);
});

await test('pending login deadline, attempt budget and single in-flight claim are enforced', async () => {
	const f = await fixture();
	await f.activate();
	let login = await f.pending();
	assert.ok(await f.store.claimLogin(login.token));
	assert.equal(await f.store.claimLogin(login.token), undefined);
	f.advance(PENDING_LOGIN_TTL_MS);
	assert.equal(await f.store.finishLogin(login.token, id), null);
	login = await f.pending();
	f.sdk.verifyTotp = (async () => fail('@error/InvalidTotpCode')) as TotpSdk['verifyTotp'];
	for (let attempt = 0; attempt < 5; attempt++)
		await assert.rejects(f.flows.verify(login.token, id, '000000'), status(400));
	await assert.rejects(f.flows.verify(login.token, id, '000000'), status(401));
	assert.equal((await f.db.select().from(sessionsTable)).length, 0);
});

await test('invalid, reused and throttled codes retain a bounded pending login; unknown outcomes cancel it', async () => {
	const f = await fixture();
	await f.activate();
	const login = await f.pending();
	for (const [tag, expected] of [
		['@error/InvalidTotpCode', 400],
		['@error/TotpCodeAlreadyUsed', 409],
		['@error/TotpRateLimited', 429]
	] as const) {
		f.sdk.verifyTotp = (async () => fail(tag, 30)) as TotpSdk['verifyTotp'];
		await assert.rejects(f.flows.verify(login.token, id, '012345'), status(expected));
		assert.equal((await f.store.pending(login.token))?.expiresAt, login.expiresAt);
	}
	f.sdk.verifyTotp = async () => {
		throw new Error('private network diagnostic');
	};
	await assert.rejects(f.flows.verify(login.token, id, '012345'));
	assert.equal(await f.store.pending(login.token), undefined);
	assert.equal((await f.db.select().from(sessionsTable)).length, 0);
});

await test('cross-account credentials and mismatched SDK identities never create sessions', async () => {
	const f = await fixture();
	await f.activate();
	let login = await f.pending();
	const before = f.calls.length;
	await assert.rejects(f.flows.verify(login.token, 'othercredential', '012345'), status(403));
	assert.equal(f.calls.length, before);
	login = await f.pending();
	f.sdk.verifyTotp = (async () =>
		ok({
			_tag: 'TotpVerified' as const,
			verifiedAt: Date.now(),
			userId: '2',
			authenticatorId: id
		})) as TotpSdk['verifyTotp'];
	await assert.rejects(f.flows.verify(login.token, id, '012345'), status(503));
	assert.equal((await f.db.select().from(sessionsTable)).length, 0);
});

await test('expiry or deletion during remote verification cannot complete a login', async () => {
	const f = await fixture();
	await f.activate();
	let login = await f.pending();
	f.sdk.verifyTotp = (async () => {
		f.advance(PENDING_LOGIN_TTL_MS);
		return ok({
			_tag: 'TotpVerified' as const,
			verifiedAt: Date.now(),
			userId: '1',
			authenticatorId: id
		});
	}) as TotpSdk['verifyTotp'];
	await assert.rejects(f.flows.verify(login.token, id, '012345'), status(401));
	login = await f.pending();
	f.sdk.verifyTotp = (async () => {
		await f.flows.remove(actor, id);
		return ok({
			_tag: 'TotpVerified' as const,
			verifiedAt: Date.now(),
			userId: '1',
			authenticatorId: id
		});
	}) as TotpSdk['verifyTotp'];
	await assert.rejects(f.flows.verify(login.token, id, '012345'), status(401));
	assert.equal((await f.db.select().from(sessionsTable)).length, 0);
});

await test('uncertain confirmation fails closed and reconciles without submitting the code again', async () => {
	const f = await fixture();
	await f.flows.enroll(actor, 'Phone');
	f.sdk.confirmTotpAuthenticator = async () => {
		throw new Error('lost response');
	};
	await assert.rejects(f.flows.confirm(actor, id, '012345'));
	assert.equal((await f.store.get(1, id))?.status, 'confirming');
	const login = await f.pending();
	assert.deepEqual((await f.store.pending(login.token))?.authenticatorIds, []);
	await f.flows.reconcile({ ...actor, sessionId: 'fresh-recovery-session' }, id);
	assert.equal((await f.store.get(1, id))?.status, 'active');
	assert.equal(await f.store.pending(login.token), undefined);
});

await test('confirmation errors with uncertain outcomes never restore email-only access', async () => {
	const f = await fixture();
	await f.flows.enroll(actor, 'Phone');
	f.sdk.confirmTotpAuthenticator = (async () =>
		fail('@error/TotpAuthenticatorAlreadyActive')) as TotpSdk['confirmTotpAuthenticator'];
	await assert.rejects(f.flows.confirm(actor, id, '012345'), status(409));
	assert.equal((await f.store.get(1, id))?.status, 'confirming');
	assert.equal((await f.pending()).kind, 'pending');
	await f.flows.reconcile({ ...actor, sessionId: 'fresh-recovery-session' }, id);
	assert.equal((await f.store.get(1, id))?.status, 'active');
});

await test('JSON contracts preserve leading zeros, reject coercion and bound bodies; failures never echo secrets', async () => {
	const request = (value: unknown) =>
		new Request('https://example.test/account/totp/confirm', {
			method: 'POST',
			headers: { 'content-type': 'application/json' },
			body: JSON.stringify(value)
		});
	assert.equal(
		(await readTotpJson(request({ authenticatorId: id, code: '012345' }), TotpSubmission)).code,
		'012345'
	);
	for (const code of [123456, ' 123456', '１２３４５６', '12345'])
		await assert.rejects(
			readTotpJson(request({ authenticatorId: id, code }), TotpSubmission),
			status(400)
		);
	await assert.rejects(
		readTotpJson(request({ authenticatorId: id, code: '012345', userId: '2' }), TotpSubmission),
		status(400)
	);
	await assert.rejects(readTotpJson(request('x'.repeat(5000)), TotpSubmission), status(413));
	const response = await totpEndpoint(async () => {
		throw new Error(setup.secret);
	});
	assert.equal(response.status, 503);
	assert.equal(response.headers.get('cache-control'), 'no-store');
	assert.doesNotMatch(await response.text(), /TEST-SETUP-SECRET/);
	const throttled = await totpEndpoint(async () => {
		throw new TotpFlowError(429, 'Wait', 30);
	});
	assert.equal(throttled.headers.get('retry-after'), '30');
	assert.equal(totpJson(setup).headers.get('cache-control'), 'no-store');
});

function cookieJar() {
	const values = new Map<string, string>();
	const options = new Map<string, Parameters<Cookies['set']>[2]>();
	const cookies = {
		get: (name: string) => values.get(name),
		set: (name: string, value: string, opts: Parameters<Cookies['set']>[2]) => {
			values.set(name, value);
			options.set(name, opts);
		}
	} as Cookies;
	return { cookies, values, options };
}
function eventFor(
	path: string,
	jar = cookieJar(),
	locals: App.Locals = { user: null, session: null }
) {
	const url = new URL(path, 'https://example.test');
	return {
		url,
		request: new Request(url),
		locals,
		cookies: jar.cookies,
		depends: () => {}
	} as unknown as { -readonly [K in keyof RequestEvent]: RequestEvent[K] };
}

await test('hooks reject cross-origin/missing Origin mutations and keep setup responses private', async () => {
	for (const origin of [undefined, 'https://attacker.test', 'null']) {
		const event = eventFor('/account/totp/enroll');
		event.request = new Request(event.url, { method: 'POST', headers: origin ? { origin } : {} });
		const response = await handle({
			event,
			resolve: async () => {
				throw new Error('must not reach handler');
			}
		});
		assert.equal(response.status, 403);
	}
	const event = eventFor('/account/totp/enroll');
	event.request = new Request(event.url, { method: 'POST', headers: { origin: event.url.origin } });
	const response = await handle({ event, resolve: async () => totpJson(setup) });
	assert.equal(response.headers.get('cache-control'), 'no-store');
	assert.equal(response.headers.get('referrer-policy'), 'no-referrer');
	assert.match(response.headers.get('content-security-policy')!, /img-src 'self' data:/);
});

await test('pending cookies cannot hydrate a session; management requires fresh passkey confirmation only when registered', async () => {
	const f = await fixture(database);
	await f.activate();
	const login = await f.pending();
	const jar = cookieJar();
	setTotpLoginCookie(jar.cookies, login.token, login.expiresAt);
	assert.equal(jar.options.get(TOTP_LOGIN_COOKIE_NAME)?.httpOnly, true);
	assert.equal(jar.options.get(TOTP_LOGIN_COOKIE_NAME)?.secure, !dev);
	assert.equal(jar.options.get(TOTP_LOGIN_COOKIE_NAME)?.sameSite, 'lax');
	assert.equal(await validateSessionToken(login.token), null);
	const event = eventFor('/account/totp', jar);
	await handle({
		event,
		resolve: async (resolved) => {
			assert.equal(resolved.locals.user, null);
			return new Response();
		}
	});
	await assert.rejects(requireTotpActor(event), status(401));
	assert.equal((await enrollRoute(event as Parameters<typeof enrollRoute>[0])).status, 401);
	event.locals = {
		user: {
			_tag: 'SessionUser',
			userId: 1,
			email: actor.email,
			givenName: 'One',
			familyName: 'User',
			createdAt: Date.now()
		},
		session: {
			_tag: 'Session',
			id: actor.sessionId,
			userId: 1,
			createdAt: Date.now(),
			lastVerifiedAt: Date.now(),
			passkeyAuthenticatedAt: null,
			totpAuthenticatedAt: null
		}
	} as App.Locals;
	assert.equal((await requireTotpActor(event)).userId, 1);
	await database
		.insert(passkeysTable)
		.values({ userId: 1, passkeyId: 'recovery-passkey', createdAt: Date.now() });
	await assert.rejects(requireTotpActor(event), status(403));
	event.locals.session!.passkeyAuthenticatedAt = Date.now();
	assert.equal((await requireTotpActor(event)).userId, 1);
	const loaded = await accountLoad(event as Parameters<typeof accountLoad>[0]);
	assert.doesNotMatch(
		JSON.stringify(loaded),
		/TEST-SETUP-SECRET|enrollmentSessionId|secretHash|apiKey/
	);
});

await test('TOTP routes support enrollment, verification, and removal for a user without passkeys', async ({
	mock
}) => {
	const f = await fixture(database);
	mock.method(Passlock.prototype, 'createTotpAuthenticator', f.sdk.createTotpAuthenticator);
	mock.method(Passlock.prototype, 'confirmTotpAuthenticator', f.sdk.confirmTotpAuthenticator);
	mock.method(Passlock.prototype, 'verifyTotp', f.sdk.verifyTotp);
	mock.method(Passlock.prototype, 'deleteTotpAuthenticator', f.sdk.deleteTotpAuthenticator);

	const jar = cookieJar();
	const post = <Path extends string>(path: Path, body: object, locals?: App.Locals) => {
		const event = eventFor(path, jar, locals);
		event.request = new Request(event.url, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(body)
		});
		return { ...event, route: { id: path }, params: {} };
	};

	assert.equal((await database.select().from(passkeysTable)).length, 0);
	const emailLogin = await f.store.beginEmailLogin(1);
	assert.equal(emailLogin.kind, 'session');
	const initialSession = await validateSessionToken(emailLogin.token);
	assert.ok(initialSession);
	const enrollment = await enrollRoute(
		post('/account/totp/enroll', { displayName: 'Phone' }, initialSession)
	);
	assert.equal(enrollment.status, 200);
	assert.equal((await enrollment.json()).authenticatorId, id);
	const submission = { authenticatorId: id, code: '012345' };
	assert.equal(
		(await confirmRoute(post('/account/totp/confirm', submission, initialSession))).status,
		200
	);

	const login = await f.pending();
	setTotpLoginCookie(jar.cookies, login.token, login.expiresAt);
	const verified = await verifyRoute(post('/login/totp/verify', submission));
	assert.equal(verified.status, 200);
	assert.equal(await f.store.pending(login.token), undefined);
	const totpSession = await validateSessionToken(jar.values.get(SESSION_COOKIE_NAME)!);
	assert.ok(totpSession);
	assert.equal(totpSession.session.passkeyAuthenticatedAt, null);
	assert.ok(totpSession.session.totpAuthenticatedAt);
	assert.equal(
		(await removeRoute(post('/account/totp/remove', { authenticatorId: id }, totpSession))).status,
		200
	);
	assert.deepEqual(await f.store.list(1), []);
	assert.equal((await f.store.beginEmailLogin(1)).kind, 'session');
});

await test('the actual passkey recovery route consumes pending state and creates a fresh verified session', async () => {
	const f = await fixture(database);
	await f.activate();
	const login = await f.pending();
	const jar = cookieJar();
	setTotpLoginCookie(jar.cookies, login.token, login.expiresAt);
	await database
		.insert(passkeysTable)
		.values({ userId: 1, passkeyId: 'recovery-passkey', createdAt: Date.now() });
	const original = Passlock.prototype.exchangeCode;
	let verified = false;
	Passlock.prototype.exchangeCode = (async () =>
		ok({
			_tag: 'ExtendedPrincipal',
			id: 'verified-login',
			authenticatorType: 'passkey',
			createdAt: Date.now(),
			expiresAt: Date.now() + 60_000,
			metadata: {},
			userId: '1',
			authenticatorId: 'recovery-passkey',
			passkey: { verified, userVerified: verified }
		})) as Passlock['exchangeCode'];
	try {
		const requestEvent = () => {
			const event = eventFor('/login/passkey', jar);
			event.request = new Request(event.url, {
				method: 'POST',
				body: JSON.stringify({ code: 'exchange-code' })
			});
			return event as Parameters<typeof recover>[0];
		};
		assert.equal((await recover(requestEvent())).status, 403);
		assert.equal(jar.values.has(SESSION_COOKIE_NAME), false);
		verified = true;
		assert.equal((await recover(requestEvent())).status, 200);
		assert.equal(await f.store.pending(login.token), undefined);
		const session = await validateSessionToken(jar.values.get(SESSION_COOKIE_NAME)!);
		assert.equal(session?.user.userId, 1);
		assert.ok(session?.session.passkeyAuthenticatedAt);
		assert.equal(jar.options.get(TOTP_LOGIN_COOKIE_NAME)?.maxAge, 0);
	} finally {
		Passlock.prototype.exchangeCode = original;
	}
});

await test('account deletion removes all local children atomically and preserves other accounts', async ({
	mock
}) => {
	const f = await fixture(database);
	const session = await f.store.beginEmailLogin(1);
	assert.equal(session.kind, 'session');
	await f.activate();
	await f.pending();
	const active = (await f.store.list(1))[0];
	await database
		.insert(totpAuthenticatorsTable)
		.values({ ...active, authenticatorId: 'pending-phone', status: 'pending' });
	await database.insert(passkeysTable).values([
		{ userId: 1, passkeyId: 'deleted-passkey', createdAt: Date.now() },
		{ userId: 2, passkeyId: 'retained-passkey', createdAt: Date.now() }
	]);
	const before = async () =>
		Promise.all([
			database.select().from(usersTable),
			database.select().from(sessionsTable),
			database.select().from(passkeysTable),
			database.select().from(totpAuthenticatorsTable),
			database.select().from(pendingTotpLoginsTable)
		]);
	const snapshot = await before();
	const remote = mock.method(Passlock.prototype, 'deleteUserCredentials', async () =>
		ok({ _tag: 'UserCredentialsDeleted' as const })
	);
	// Force a failure at the final delete, after all children have been removed.
	await database.$client.execute(
		`CREATE TRIGGER reject_user_deletion BEFORE DELETE ON users BEGIN SELECT RAISE(ABORT, 'test rollback'); END`
	);
	await assert.rejects(deleteAccount(1));
	assert.deepEqual(await before(), snapshot);
	await database.$client.execute('DROP TRIGGER reject_user_deletion');
	assert.equal(await deleteAccount(1), true);
	assert.equal(remote.mock.callCount(), 2);
	assert.deepEqual(remote.mock.calls[0].arguments, [{ userId: '1' }]);
	const [users, sessions, passkeys, authenticators, logins] = await before();
	assert.deepEqual(
		users.map((row) => row.id),
		[2]
	);
	assert.deepEqual(
		passkeys.map((row) => row.passkeyId),
		['retained-passkey']
	);
	assert.deepEqual([sessions, authenticators, logins], [[], [], []]);
	assert.equal(await deleteUser(1), false);
});

await test('remote account cleanup failure leaves every local record intact', async ({ mock }) => {
	const f = await fixture(database);
	await f.activate();
	await f.pending();
	await database.insert(passkeysTable).values({ userId: 1, passkeyId: 'keep', createdAt: 1 });
	mock.method(Passlock.prototype, 'deleteUserCredentials', async () =>
		fail('@error/UserCredentialsDeletion')
	);
	assert.equal(await deleteAccount(1), false);
	assert.equal((await database.select().from(usersTable)).length, 2);
	assert.equal((await database.select().from(passkeysTable)).length, 1);
	assert.equal((await f.store.list(1)).length, 1);
	assert.equal((await database.select().from(pendingTotpLoginsTable)).length, 1);
});

await test('account deletion action validates and re-authenticates before touching remote credentials', async ({
	mock
}) => {
	const f = await fixture(database);
	const login = await f.store.beginEmailLogin(1);
	assert.equal(login.kind, 'session');
	const locals = await validateSessionToken(login.token);
	assert.ok(locals);
	await f.activate();
	await f.pending();
	await database.insert(passkeysTable).values({ userId: 1, passkeyId: 'passkey', createdAt: 1 });
	const jar = cookieJar();
	const remote = mock.method(Passlock.prototype, 'deleteUserCredentials', async () =>
		ok({ _tag: 'UserCredentialsDeleted' as const })
	);
	const submit = (intent: string) => {
		const event = eventFor('/account/delete', jar, locals);
		event.request = new Request(event.url, {
			method: 'POST',
			body: new URLSearchParams({ intent })
		});
		return deleteAccountActions.default(
			event as Parameters<typeof deleteAccountActions.default>[0]
		);
	};
	assert.equal((await submit('invalid')).status, 400);
	assert.equal((await submit('delete-account')).status, 400);
	assert.equal(remote.mock.callCount(), 0);
	assert.equal((await database.select().from(passkeysTable)).length, 1);
	locals.session.passkeyAuthenticatedAt = Date.now();
	await assert.rejects(submit('delete-account'), (error: unknown) => {
		assert.equal((error as { status: number }).status, 303);
		assert.equal((error as { location: string }).location, '/');
		return true;
	});
	assert.equal(remote.mock.callCount(), 1);
	assert.equal(jar.values.get(SESSION_COOKIE_NAME), '');
	assert.deepEqual(await f.store.list(1), []);
	assert.equal((await database.select().from(pendingTotpLoginsTable)).length, 0);
	assert.equal((await database.select().from(passkeysTable)).length, 0);
});

await test('account re-authentication skips absent factors, uses TOTP freshness, and prioritizes passkeys', async () => {
	const { getAccountContext } = await import('./lib/server/account');
	const f = await fixture(database);
	const login = await f.store.beginEmailLogin(1);
	assert.equal(login.kind, 'session');
	const locals = await validateSessionToken(login.token);
	assert.ok(locals);
	const context = () => getAccountContext(locals);
	assert.equal((await context())?.accountReauthenticationRequired, false);
	await f.flows.enroll(actor, 'Phone');
	assert.equal(
		(await context())?.accountReauthenticationRequired,
		false,
		'pending enrollment is not a factor'
	);
	await f.flows.confirm(actor, id, '012345');
	assert.equal((await context())?.reauthenticationMethod, 'totp');
	assert.equal((await context())?.accountReauthenticationRequired, true);
	locals.session.totpAuthenticatedAt = Date.now();
	assert.equal((await context())?.accountReauthenticationRequired, false);
	locals.session.totpAuthenticatedAt = Date.now() - 600_001;
	assert.equal((await context())?.accountReauthenticationRequired, true);
	locals.session.totpAuthenticatedAt = Date.now();
	await database.insert(passkeysTable).values({ userId: 1, passkeyId: 'preferred', createdAt: 1 });
	assert.equal((await context())?.reauthenticationMethod, 'passkey');
	assert.equal(
		(await context())?.accountReauthenticationRequired,
		true,
		'TOTP must not satisfy passkey policy'
	);
	locals.session.passkeyAuthenticatedAt = Date.now();
	assert.equal((await context())?.accountReauthenticationRequired, false);
	locals.session.passkeyAuthenticatedAt = Date.now() - 600_001;
	assert.equal((await context())?.accountReauthenticationRequired, true);
});

await test('TOTP account confirmation verifies ownership and updates only the existing session', async ({
	mock
}) => {
	const { POST } = await import('./routes/account/totp/re-authenticate/+server');
	const f = await fixture(database);
	const login = await f.store.beginEmailLogin(1);
	assert.equal(login.kind, 'session');
	const locals = await validateSessionToken(login.token);
	assert.ok(locals);
	await f.activate();
	const remote = mock.method(Passlock.prototype, 'verifyTotp', f.sdk.verifyTotp);
	const submit = (authenticatorId = id, actorLocals = locals) => {
		const event = eventFor('/account/totp/re-authenticate', cookieJar(), actorLocals);
		event.request = new Request(event.url, {
			method: 'POST',
			headers: { 'content-type': 'application/json' },
			body: JSON.stringify({ authenticatorId, code: '012345' })
		});
		return POST(event as Parameters<typeof POST>[0]);
	};
	assert.equal((await submit('zzzzzzzzzzzzzzz')).status, 404);
	assert.equal(remote.mock.callCount(), 0);
	assert.equal((await submit()).status, 200);
	const refreshed = await validateSessionToken(login.token);
	assert.ok(refreshed?.session.totpAuthenticatedAt);
	assert.equal(refreshed.session.passkeyAuthenticatedAt, null);
	assert.equal((await database.select().from(sessionsTable)).length, 1);
	const other = await f.store.beginEmailLogin(2);
	assert.equal(other.kind, 'session');
	const otherLocals = await validateSessionToken(other.token);
	assert.ok(otherLocals);
	assert.equal((await submit(id, otherLocals)).status, 403);
	await database.insert(passkeysTable).values({ userId: 1, passkeyId: 'preferred', createdAt: 1 });
	assert.equal((await submit()).status, 403);
	assert.equal(remote.mock.callCount(), 1);
});

await test('rejected, replayed, throttled and mismatched TOTP verification never succeeds', async () => {
	const f = await fixture();
	await f.activate();
	for (const [tag, status] of [
		['@error/InvalidTotpCode', 400],
		['@error/TotpCodeAlreadyUsed', 409],
		['@error/TotpRateLimited', 429]
	] as const) {
		const sdk = { ...f.sdk, verifyTotp: async () => fail(tag, 30) } as unknown as TotpSdk;
		await assert.rejects(
			createTotpFlows({ store: f.store, sdk }).reauthenticate(actor, id, '012345'),
			(error: unknown) => error instanceof TotpFlowError && error.status === status
		);
	}
	const sdk = {
		...f.sdk,
		verifyTotp: async () => ok({ userId: '2', authenticatorId: id, verifiedAt: Date.now() })
	} as unknown as TotpSdk;
	await assert.rejects(
		createTotpFlows({ store: f.store, sdk }).reauthenticate(actor, id, '012345'),
		(error: unknown) => error instanceof TotpFlowError && error.status === 503
	);
});

await test('stale TOTP blocks account updates and deletion before any account mutation', async ({
	mock
}) => {
	const { actions } = await import('./routes/account/+page.server');
	const f = await fixture(database);
	const login = await f.store.beginEmailLogin(1);
	assert.equal(login.kind, 'session');
	const locals = await validateSessionToken(login.token);
	assert.ok(locals);
	await f.activate();
	const remote = mock.method(Passlock.prototype, 'deleteUserCredentials', async () =>
		ok({ _tag: 'UserCredentialsDeleted' as const })
	);
	const event = (body: Record<string, string>) => {
		const event = eventFor('/account', cookieJar(), locals);
		event.request = new Request(event.url, { method: 'POST', body: new URLSearchParams(body) });
		return event;
	};
	const profileEvent = event({ givenName: 'Changed', familyName: 'Name' });
	const profileResult = await actions.profile(
		profileEvent as Parameters<typeof actions.profile>[0]
	);
	assert.ok('status' in profileResult);
	assert.equal(profileResult.status, 400);
	const emailEvent = event({ email: 'new@example.test' });
	const emailResult = await actions.email(emailEvent as Parameters<typeof actions.email>[0]);
	assert.ok('status' in emailResult);
	assert.equal(emailResult.status, 400);
	const deleteEvent = event({ intent: 'delete-account' });
	assert.equal(
		(
			await deleteAccountActions.default(
				deleteEvent as Parameters<typeof deleteAccountActions.default>[0]
			)
		).status,
		400
	);
	assert.equal(remote.mock.callCount(), 0);
	assert.equal((await database.select().from(usersTable))[0].givenName, 'Example');
	locals.session.totpAuthenticatedAt = Date.now();
	const freshEvent = event({ givenName: 'Changed', familyName: 'Name' });
	await actions.profile(freshEvent as Parameters<typeof actions.profile>[0]);
	assert.equal((await database.select().from(usersTable))[0].givenName, 'Changed');
});

import { Passlock } from '@passlock/server';
import db from './db';
import { getPasslockConfig } from './passlock';
import { createTotpStore } from './totpStore';
import { createTotpFlows } from './totp';

export const totpStore = createTotpStore(db);
export const getTotpFlows = () =>
	createTotpFlows({
		store: totpStore,
		sdk: new Passlock(getPasslockConfig())
	});

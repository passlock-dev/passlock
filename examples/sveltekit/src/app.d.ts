import type { Session, SessionUser } from '$lib/server/repository';

// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
declare global {
	namespace App {
		// interface Error {}
		interface Locals {
			session: Session | null;
			user: SessionUser | null;
		}
		interface PageData {
			user: SessionUser | null;
		}
		// interface PageState {}
		// interface Platform {}
	}
}

export {};

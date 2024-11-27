<!-- 
  @component
  
  Displays a `Sign in with Google` button and an (optional) one-tap prompt.

  **IMPORTANT**: You will need to enter your Google Client ID in your Passlock
  settings - https://console.passlock.dev/settings (near the bottom under 
  'Social Login')

  ## Passlock integration
  When the user signs in, this component interacts with the Passlock backend 
  to register or authenticate the user. Passlock will handle the id_token 
  verification. Following a successful sign up event you should see a new 
  user in your Passlock console. 
  
  Ultimately the component fires a custom 'principal' event, containing the 
  Passlock Principal. 

  ## Duplicate accounts warnings
  If the user tries to register or sign in with their Google account but they 
  already registered a passkey (to the same email address) they will be prompted 
  to authenticate using their passkey instead.

  ## Custom button for better UX
  The sign in with Google code renders a button. This can lead to layout shifts 
  and the style of the button may not fit in with the rest of the site. We use a
  workaround (aka hack) by which we proxy clicks from our own button to the "real"
  google button which is hidden.
-->
<script lang="ts" context="module">
	export type Options = {
		tenancyId: string;
		clientId: string;
		context: Context;
		endpoint?: string;
		google: {
			clientId: string;
			useOneTap: boolean;
		};
	};
</script>

<script lang="ts">
	import { Passlock, PasslockError, type Principal } from '@passlock/client';
	import { createEventDispatcher, onMount } from 'svelte';
	import type { Context } from './context.js';

	const dispatch = createEventDispatcher<{ principal: Principal }>();

	export let options: Options;

	let googleBtnWrapper: HTMLDivElement;
	let googleBtn: HTMLButtonElement | null;
	let submitting = false;
	let error = '';

	const passlock = new Passlock(options);

	// We need to poll as on:load doesn't currently work for scripts
	// see https://github.com/sveltejs/svelte/issues/8301
	const googleScripts = () => {
		return new Promise<void>((resolve) => {
			if (typeof google !== 'undefined' && google !== null) {
				resolve();
			} else {
				const interval = setInterval(() => {
					if (typeof google !== 'undefined' && google !== null) {
						clearInterval(interval);
						resolve();
					}
				}, 100);
			}
		});
	};

	const callPasslock = async (args: { credential: string; nonce: string }) => {
		switch (options.context) {
			case 'signup': {
				return await passlock.registerOidc({
					provider: 'google',
					idToken: args.credential,
					nonce: args.nonce
				});
			}

			case 'signin': {
				return await passlock.authenticateOidc({
					provider: 'google',
					idToken: args.credential,
					nonce: args.nonce
				});
			}
		}
	};

	const initialize = async () => {
		await googleScripts();
		const nonce = crypto.randomUUID();

		google.accounts.id.initialize({
			client_id: options.google.clientId,
			ux_mode: 'popup',
			nonce: nonce,
			context: options.context,
			callback: async ({ credential }) => {
				submitting = true;

				const response = await callPasslock({ credential, nonce });
				if (PasslockError.isError(response) && response.detail) {
					submitting = false;
					error = `${response.message}. ${response.detail}`.trim();
				} else if (PasslockError.isError(response)) {
					submitting = false;
					error = response.message;
				} else {
					submitting = false;
					dispatch('principal', response);
				}
			}
		});

		if (options.google.useOneTap) {
			google.accounts.id.prompt();
		}

		google.accounts.id.renderButton(googleBtnWrapper, {
			type: 'icon',
			width: 200
		});

		googleBtn = googleBtnWrapper.querySelector('div[role=button]');
	};

	onMount(initialize);

	const click = () => {
		error = '';
		googleBtn?.click();
	};
</script>

<div bind:this={googleBtnWrapper} class="hidden"></div>

<slot {click} {submitting} />

<slot name="error" {error} />

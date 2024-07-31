<!-- 
  @component
  
  Displays a `Sign in with Apple` button.

  **IMPORTANT**: You will need to enter your Apple Client ID in your Passlock
  settings - https://console.passlock.dev/settings (near the bottom under 
  'Social Login'). You will also need to run your app (even during development)
  on a publicly accessible https url. We recommend something like ngrok.

  ## Passlock integration
  When the user signs in, this component interacts with the Passlock backend 
  to register or authenticate the user. Passlock will handle the id_token 
  verification. Following a successful sign up event you should see a new 
  user in your Passlock console. 
  
  Ultimately this component fires a custom 'principal' event, containing the 
  Passlock Principal. 

  ## Duplicate accounts warnings
  If the user tries to register or sign in with their Apple account but they 
  already registered a passkey (with the same email address) they will be prompted 
  to authenticate using their passkey instead.
-->
<script lang="ts" context="module">
	export type Options = {
		tenancyId: string;
		clientId: string;
		endpoint?: string;
    context: Context;
		apple: {
			clientId: string;
			redirectURL?: string;
		};
	};
</script>

<script lang="ts">
	import { Passlock, PasslockError, type Principal } from '@passlock/client';
	import { createEventDispatcher } from 'svelte';
	import type { Context } from './context.js';

	const dispatch = createEventDispatcher<{ principal: Principal }>();

	export let options: Options;

	let submitting = false;
	let error = '';

	const passlock = new Passlock(options);

  // We need to poll as on:load doesn't currently work for scripts
	// see https://github.com/sveltejs/svelte/issues/8301
	const appleScripts = () => {
		return new Promise<void>((resolve) => {
			if (typeof AppleID !== 'undefined' && AppleID !== null) {
				resolve();
			} else {
				const interval = setInterval(() => {
					if (typeof AppleID !== 'undefined' && AppleID !== null) {
						clearInterval(interval);
						resolve();
					}
				}, 100);
			}
		});
  }

	const callPasslock = async (nonce: string, res: AppleSignInAPI.SignInResponseI) => {
		if (options.context === 'signup' && res.user) {
			return await passlock.registerOidc({
				provider: 'apple',
				idToken: res.authorization.id_token,
				givenName: res.user.name.firstName,
				familyName: res.user.name.lastName,
				nonce: nonce
			});
		} else if (options.context === 'signin') {
			return await passlock.authenticateOidc({
				provider: 'apple',
				idToken: res.authorization.id_token,
				nonce: nonce
			});
		} else {
			return new Error('No first_name or last_name returned by Apple');
		}
	};

	const verifyToken = async (nonce: string, res: AppleSignInAPI.SignInResponseI) => {
		const principal = await callPasslock(nonce, res);
		if (principal instanceof Error) {
			console.error(principal);
			error = 'Sorry, something went wrong';
			submitting = false;
			return;
		}

		if (PasslockError.isError(principal) && principal.detail) {
			submitting = false;
			error = `${principal.message}. ${principal.detail}`.trim();
		} else if (PasslockError.isError(principal)) {
			submitting = false;
			error = principal.message;
		} else {
			submitting = false;
			dispatch('principal', principal);
		}
	};

	const signIn = async () => {
		try {
      error = '';
			submitting = true;
			await appleScripts();

			// Otherwise Apple Sign in blocks the UI before the spinner can do it magic
			await new Promise((resolve) => setTimeout(resolve, 20));

			const baseURL = window.location.protocol + '//' + window.location.host;

			AppleID.auth.init({
				clientId: options.apple.clientId,
				scope: 'name email',
				redirectURI: options.apple.redirectURL || baseURL,
				usePopup: true
			});

			const nonce = crypto.randomUUID();
			const appleResponse = await AppleID.auth.signIn({ nonce });
			await verifyToken(nonce, appleResponse);
		} catch (err) {
			console.error(err);
			submitting = false;
			error = 'Sorry, something went wrong';
		}
	};

	const click = async () => {
		await signIn();
	};
</script>

<slot {click} {submitting} />

<slot name="error" {error} />

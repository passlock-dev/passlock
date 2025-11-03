
// this file is generated — do not edit it


/// <reference types="@sveltejs/kit" />

/**
 * Environment variables [loaded by Vite](https://vitejs.dev/guide/env-and-mode.html#env-files) from `.env` files and `process.env`. Like [`$env/dynamic/private`](https://svelte.dev/docs/kit/$env-dynamic-private), this module cannot be imported into client-side code. This module only includes variables that _do not_ begin with [`config.kit.env.publicPrefix`](https://svelte.dev/docs/kit/configuration#env) _and do_ start with [`config.kit.env.privatePrefix`](https://svelte.dev/docs/kit/configuration#env) (if configured).
 * 
 * _Unlike_ [`$env/dynamic/private`](https://svelte.dev/docs/kit/$env-dynamic-private), the values exported from this module are statically injected into your bundle at build time, enabling optimisations like dead code elimination.
 * 
 * ```ts
 * import { API_KEY } from '$env/static/private';
 * ```
 * 
 * Note that all environment variables referenced in your code should be declared (for example in an `.env` file), even if they don't have a value until the app is deployed:
 * 
 * ```
 * MY_FEATURE_FLAG=""
 * ```
 * 
 * You can override `.env` values from the command line like so:
 * 
 * ```bash
 * MY_FEATURE_FLAG="enabled" npm run dev
 * ```
 */
declare module '$env/static/private' {
	export const PASSLOCK_API_KEY: string;
	export const DATABASE_URL: string;
	export const NVM_INC: string;
	export const npm_package_devDependencies_prisma: string;
	export const npm_package_devDependencies_prettier: string;
	export const npm_package_dependencies_valibot: string;
	export const TERM_PROGRAM: string;
	export const NODE: string;
	export const NVM_CD_FLAGS: string;
	export const npm_package_devDependencies_prettier_plugin_svelte: string;
	export const npm_package_devDependencies_typescript: string;
	export const INIT_CWD: string;
	export const SHELL: string;
	export const TERM: string;
	export const npm_package_devDependencies_vite: string;
	export const TMPDIR: string;
	export const HOMEBREW_REPOSITORY: string;
	export const npm_package_devDependencies_npm_check_updates: string;
	export const TERM_PROGRAM_VERSION: string;
	export const npm_package_scripts_dev: string;
	export const npm_package_devDependencies_postcss_load_config: string;
	export const MallocNanoZone: string;
	export const ORIGINAL_XDG_CURRENT_DESKTOP: string;
	export const ZDOTDIR: string;
	export const npm_package_private: string;
	export const npm_package_devDependencies__sveltejs_kit: string;
	export const npm_config_registry: string;
	export const npm_package_devDependencies_svelte_kit_sst: string;
	export const npm_package_scripts_prisma_migrate: string;
	export const USER: string;
	export const NVM_DIR: string;
	export const npm_package_scripts_check_watch: string;
	export const COMMAND_MODE: string;
	export const npm_package_devDependencies__types_google_one_tap: string;
	export const npm_package_devDependencies_better_sqlite3: string;
	export const PNPM_SCRIPT_SRC_DIR: string;
	export const SSH_AUTH_SOCK: string;
	export const npm_package_devDependencies_lucia: string;
	export const npm_package_dependencies__prisma_client: string;
	export const __CF_USER_TEXT_ENCODING: string;
	export const npm_package_devDependencies__passlock_sveltekit: string;
	export const npm_package_devDependencies_postcss: string;
	export const npm_package_devDependencies_tslib: string;
	export const npm_execpath: string;
	export const npm_package_devDependencies_js_sha256: string;
	export const npm_package_devDependencies_svelte: string;
	export const npm_package_devDependencies_dedent: string;
	export const npm_config_frozen_lockfile: string;
	export const npm_package_devDependencies_sveltekit_superforms: string;
	export const PATH: string;
	export const npm_package_devDependencies__types_better_sqlite3: string;
	export const npm_package_scripts_typecheck: string;
	export const npm_package_devDependencies__tailwindcss_aspect_ratio: string;
	export const __CFBundleIdentifier: string;
	export const USER_ZDOTDIR: string;
	export const PWD: string;
	export const npm_package_devDependencies_tailwindcss: string;
	export const npm_command: string;
	export const npm_package_scripts_preview: string;
	export const npm_package_devDependencies_lucide_svelte: string;
	export const npm_lifecycle_event: string;
	export const LANG: string;
	export const npm_package_name: string;
	export const npm_package_devDependencies__sveltejs_vite_plugin_svelte: string;
	export const npm_package_packageManager: string;
	export const NODE_PATH: string;
	export const npm_package_scripts_build: string;
	export const XPC_FLAGS: string;
	export const VSCODE_GIT_ASKPASS_EXTRA_ARGS: string;
	export const npm_package_devDependencies__lucia_auth_adapter_prisma: string;
	export const npm_package_devDependencies__tailwindcss_forms: string;
	export const npm_package_devDependencies_mode_watcher: string;
	export const npm_package_devDependencies_node_check_updates: string;
	export const npm_config_node_gyp: string;
	export const XPC_SERVICE_NAME: string;
	export const npm_package_version: string;
	export const npm_package_devDependencies__sveltejs_adapter_auto: string;
	export const VSCODE_INJECTION: string;
	export const npm_package_devDependencies_autoprefixer: string;
	export const npm_package_devDependencies_svelte_check: string;
	export const HOME: string;
	export const SHLVL: string;
	export const npm_package_type: string;
	export const VSCODE_GIT_ASKPASS_MAIN: string;
	export const npm_package_scripts_upgrade_deps: string;
	export const HOMEBREW_PREFIX: string;
	export const LOGNAME: string;
	export const npm_package_scripts_format: string;
	export const npm_lifecycle_script: string;
	export const VSCODE_GIT_IPC_HANDLE: string;
	export const NVM_BIN: string;
	export const npm_package_devDependencies__melt_ui_svelte: string;
	export const npm_config_user_agent: string;
	export const HOMEBREW_CELLAR: string;
	export const INFOPATH: string;
	export const GIT_ASKPASS: string;
	export const VSCODE_GIT_ASKPASS_NODE: string;
	export const npm_package_devDependencies__melt_ui_pp: string;
	export const npm_package_devDependencies__types_apple_signin_api: string;
	export const npm_package_scripts_check_errors: string;
	export const npm_package_scripts_check: string;
	export const npm_package_devDependencies_electrodb: string;
	export const COLORTERM: string;
	export const npm_node_execpath: string;
	export const NODE_ENV: string;
}

/**
 * Similar to [`$env/static/private`](https://svelte.dev/docs/kit/$env-static-private), except that it only includes environment variables that begin with [`config.kit.env.publicPrefix`](https://svelte.dev/docs/kit/configuration#env) (which defaults to `PUBLIC_`), and can therefore safely be exposed to client-side code.
 * 
 * Values are replaced statically at build time.
 * 
 * ```ts
 * import { PUBLIC_BASE_URL } from '$env/static/public';
 * ```
 */
declare module '$env/static/public' {
	export const PUBLIC_PASSLOCK_TENANCY_ID: string;
	export const PUBLIC_PASSLOCK_CLIENT_ID: string;
	export const PUBLIC_PASSLOCK_ENDPOINT: string;
	export const PUBLIC_GOOGLE_CLIENT_ID: string;
	export const PUBLIC_APPLE_CLIENT_ID: string;
	export const PUBLIC_APPLE_REDIRECT_URL: string;
}

/**
 * This module provides access to runtime environment variables, as defined by the platform you're running on. For example if you're using [`adapter-node`](https://github.com/sveltejs/kit/tree/main/packages/adapter-node) (or running [`vite preview`](https://svelte.dev/docs/kit/cli)), this is equivalent to `process.env`. This module only includes variables that _do not_ begin with [`config.kit.env.publicPrefix`](https://svelte.dev/docs/kit/configuration#env) _and do_ start with [`config.kit.env.privatePrefix`](https://svelte.dev/docs/kit/configuration#env) (if configured).
 * 
 * This module cannot be imported into client-side code.
 * 
 * Dynamic environment variables cannot be used during prerendering.
 * 
 * ```ts
 * import { env } from '$env/dynamic/private';
 * console.log(env.DEPLOYMENT_SPECIFIC_VARIABLE);
 * ```
 * 
 * > In `dev`, `$env/dynamic` always includes environment variables from `.env`. In `prod`, this behavior will depend on your adapter.
 */
declare module '$env/dynamic/private' {
	export const env: {
		PASSLOCK_API_KEY: string;
		DATABASE_URL: string;
		NVM_INC: string;
		npm_package_devDependencies_prisma: string;
		npm_package_devDependencies_prettier: string;
		npm_package_dependencies_valibot: string;
		TERM_PROGRAM: string;
		NODE: string;
		NVM_CD_FLAGS: string;
		npm_package_devDependencies_prettier_plugin_svelte: string;
		npm_package_devDependencies_typescript: string;
		INIT_CWD: string;
		SHELL: string;
		TERM: string;
		npm_package_devDependencies_vite: string;
		TMPDIR: string;
		HOMEBREW_REPOSITORY: string;
		npm_package_devDependencies_npm_check_updates: string;
		TERM_PROGRAM_VERSION: string;
		npm_package_scripts_dev: string;
		npm_package_devDependencies_postcss_load_config: string;
		MallocNanoZone: string;
		ORIGINAL_XDG_CURRENT_DESKTOP: string;
		ZDOTDIR: string;
		npm_package_private: string;
		npm_package_devDependencies__sveltejs_kit: string;
		npm_config_registry: string;
		npm_package_devDependencies_svelte_kit_sst: string;
		npm_package_scripts_prisma_migrate: string;
		USER: string;
		NVM_DIR: string;
		npm_package_scripts_check_watch: string;
		COMMAND_MODE: string;
		npm_package_devDependencies__types_google_one_tap: string;
		npm_package_devDependencies_better_sqlite3: string;
		PNPM_SCRIPT_SRC_DIR: string;
		SSH_AUTH_SOCK: string;
		npm_package_devDependencies_lucia: string;
		npm_package_dependencies__prisma_client: string;
		__CF_USER_TEXT_ENCODING: string;
		npm_package_devDependencies__passlock_sveltekit: string;
		npm_package_devDependencies_postcss: string;
		npm_package_devDependencies_tslib: string;
		npm_execpath: string;
		npm_package_devDependencies_js_sha256: string;
		npm_package_devDependencies_svelte: string;
		npm_package_devDependencies_dedent: string;
		npm_config_frozen_lockfile: string;
		npm_package_devDependencies_sveltekit_superforms: string;
		PATH: string;
		npm_package_devDependencies__types_better_sqlite3: string;
		npm_package_scripts_typecheck: string;
		npm_package_devDependencies__tailwindcss_aspect_ratio: string;
		__CFBundleIdentifier: string;
		USER_ZDOTDIR: string;
		PWD: string;
		npm_package_devDependencies_tailwindcss: string;
		npm_command: string;
		npm_package_scripts_preview: string;
		npm_package_devDependencies_lucide_svelte: string;
		npm_lifecycle_event: string;
		LANG: string;
		npm_package_name: string;
		npm_package_devDependencies__sveltejs_vite_plugin_svelte: string;
		npm_package_packageManager: string;
		NODE_PATH: string;
		npm_package_scripts_build: string;
		XPC_FLAGS: string;
		VSCODE_GIT_ASKPASS_EXTRA_ARGS: string;
		npm_package_devDependencies__lucia_auth_adapter_prisma: string;
		npm_package_devDependencies__tailwindcss_forms: string;
		npm_package_devDependencies_mode_watcher: string;
		npm_package_devDependencies_node_check_updates: string;
		npm_config_node_gyp: string;
		XPC_SERVICE_NAME: string;
		npm_package_version: string;
		npm_package_devDependencies__sveltejs_adapter_auto: string;
		VSCODE_INJECTION: string;
		npm_package_devDependencies_autoprefixer: string;
		npm_package_devDependencies_svelte_check: string;
		HOME: string;
		SHLVL: string;
		npm_package_type: string;
		VSCODE_GIT_ASKPASS_MAIN: string;
		npm_package_scripts_upgrade_deps: string;
		HOMEBREW_PREFIX: string;
		LOGNAME: string;
		npm_package_scripts_format: string;
		npm_lifecycle_script: string;
		VSCODE_GIT_IPC_HANDLE: string;
		NVM_BIN: string;
		npm_package_devDependencies__melt_ui_svelte: string;
		npm_config_user_agent: string;
		HOMEBREW_CELLAR: string;
		INFOPATH: string;
		GIT_ASKPASS: string;
		VSCODE_GIT_ASKPASS_NODE: string;
		npm_package_devDependencies__melt_ui_pp: string;
		npm_package_devDependencies__types_apple_signin_api: string;
		npm_package_scripts_check_errors: string;
		npm_package_scripts_check: string;
		npm_package_devDependencies_electrodb: string;
		COLORTERM: string;
		npm_node_execpath: string;
		NODE_ENV: string;
		[key: `PUBLIC_${string}`]: undefined;
		[key: `${string}`]: string | undefined;
	}
}

/**
 * Similar to [`$env/dynamic/private`](https://svelte.dev/docs/kit/$env-dynamic-private), but only includes variables that begin with [`config.kit.env.publicPrefix`](https://svelte.dev/docs/kit/configuration#env) (which defaults to `PUBLIC_`), and can therefore safely be exposed to client-side code.
 * 
 * Note that public dynamic environment variables must all be sent from the server to the client, causing larger network requests — when possible, use `$env/static/public` instead.
 * 
 * Dynamic environment variables cannot be used during prerendering.
 * 
 * ```ts
 * import { env } from '$env/dynamic/public';
 * console.log(env.PUBLIC_DEPLOYMENT_SPECIFIC_VARIABLE);
 * ```
 */
declare module '$env/dynamic/public' {
	export const env: {
		PUBLIC_PASSLOCK_TENANCY_ID: string;
		PUBLIC_PASSLOCK_CLIENT_ID: string;
		PUBLIC_PASSLOCK_ENDPOINT: string;
		PUBLIC_GOOGLE_CLIENT_ID: string;
		PUBLIC_APPLE_CLIENT_ID: string;
		PUBLIC_APPLE_REDIRECT_URL: string;
		[key: `PUBLIC_${string}`]: string | undefined;
	}
}

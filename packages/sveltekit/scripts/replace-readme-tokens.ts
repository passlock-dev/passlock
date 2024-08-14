import { fileURLToPath } from 'node:url';
import { replaceReadmeTokens } from '@passlock/shared/scripts/replace-readme-tokens.js';

// see https://stackoverflow.com/a/60309682
if (process.argv[1] === fileURLToPath(import.meta.url)) {
	console.log('Replacing packages/sveltekit tokens');
	await replaceReadmeTokens(import.meta.url);
}

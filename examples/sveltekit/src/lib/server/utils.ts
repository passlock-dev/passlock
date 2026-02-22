import { randomBytes } from 'node:crypto';

const SESSION_ALPHABET = 'abcdefghijklmnopqrstuvwxyz234567';

export const generateRandomString = (size: number): string => {
	const bytes = randomBytes(size);

	let output = '';
	for (let i = 0; i < size; i++) {
		output += SESSION_ALPHABET[bytes[i] % SESSION_ALPHABET.length];
	}

	return output;
};

/**
 * Password hashing utils
 * Note: This is node specific, if you're not running node you'll
 * need to swap out hashPassword and verifyPasswordHash
 */

import { randomBytes, scrypt, timingSafeEqual, type BinaryLike } from 'node:crypto';
import { promisify } from 'node:util';

const scryptAsync = promisify<BinaryLike, BinaryLike, number, Buffer>(scrypt);

export const hashPassword = async (password: string) => {
	const salt = randomBytes(16).toString('hex');
	const buf = await scryptAsync(password, salt, 64);
	return `${buf.toString('hex')}.${salt}`;
};

export const verifyPasswordHash = async (storedPasswordHash: string, suppliedPassword: string) => {
	// split() returns array
	const [hashedPassword, salt] = storedPasswordHash.split('.');
	// we need to pass buffer values to timingSafeEqual
	const hashedPasswordBuf = Buffer.from(hashedPassword, 'hex');
	// we hash the new sign-in password
	const suppliedPasswordBuf = (await scryptAsync(suppliedPassword, salt, 64)) as Buffer;
	// compare the new supplied password with the stored hashed password
	return timingSafeEqual(hashedPasswordBuf, suppliedPasswordBuf);
};

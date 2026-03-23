import { createHash, timingSafeEqual } from "node:crypto";

export const hashText = (cleartext: string): string => 
  createHash('sha256').update(cleartext).digest('hex');

export const isEqualHash = (storedHash: string, suppliedHash: string): boolean => {
  const storedHashBuffer = Buffer.from(storedHash, 'hex');
  const suppliedHashBuffer = Buffer.from(suppliedHash, 'hex');

  if (storedHashBuffer.length !== suppliedHashBuffer.length) return false;
  return timingSafeEqual(storedHashBuffer, suppliedHashBuffer);
};
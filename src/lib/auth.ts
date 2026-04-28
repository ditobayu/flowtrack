import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret';
const ACCESS_EXPIRY = '7d';

export async function hashPassword(pw: string) { return bcrypt.hash(pw, 12); }
export async function comparePassword(pw: string, hash: string) { return bcrypt.compare(pw, hash); }
export function signToken(payload: object) { return jwt.sign(payload, JWT_SECRET, { expiresIn: ACCESS_EXPIRY }); }
export function verifyToken(token: string) { return jwt.verify(token, JWT_SECRET) as any; }

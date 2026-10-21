import crypto from 'crypto';
import dotenv from 'dotenv';
dotenv.config();

const CONFIGURED_SECRET = process.env.AUTH_SECRET || process.env.SESSION_SECRET || process.env.JWT_SECRET;
const isProdEnvironment = process.env.NODE_ENV === 'production' || process.env.VERCEL_ENV === 'production';
const AUTH_SECRET = CONFIGURED_SECRET || (!isProdEnvironment ? 'thamtutoannhi-dev-insecure-secret-key-change-in-production' : '');

export function makeToken(session: {
  uid: string;
  role: 'admin' | 'teacher' | 'student';
  displayName: string;
  email?: string;
  studentCode?: string;
  classId?: string;
  grade?: number;
}) {
  if (!AUTH_SECRET) {
    throw new Error('AUTH_SECRET is empty');
  }
  const exp = Math.floor(Date.now() / 1000) + 7 * 86400;
  const payload = { ...session, exp };
  const encodedPayload = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = crypto.createHmac('sha256', AUTH_SECRET).update(encodedPayload).digest('base64url');
  return `${encodedPayload}.${signature}`;
}

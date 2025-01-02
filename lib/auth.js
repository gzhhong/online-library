import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';

export function verifyToken(token) {
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch {
    return null;
  }
}

export function generateToken(payload) {
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '30m' });
}

export function getTokenFromCookies() {
  const cookieStore = cookies();
  return cookieStore.get('token');
} 
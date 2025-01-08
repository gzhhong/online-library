import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';

export function verifyToken(token) {
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    return decoded && decoded.isAdmin === true;
  } catch (error) {
    console.error('Token verification failed:', error);
    return false;
  }
}

export function generateToken(payload) {
  const tokenPayload = {
    ...payload,
    isAdmin: true
  };
  return jwt.sign(tokenPayload, process.env.JWT_SECRET, { expiresIn: '30m' });
}

export function getTokenFromCookies() {
  const cookieStore = cookies();
  return cookieStore.get('token');
} 
import prisma from '@/lib/db';
import { generateToken } from '@/lib/auth';
import { cookies } from 'next/headers';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { email, password } = req.body;

    if (email === process.env.ADMIN_EMAIL && password === process.env.ADMIN_PASSWORD) {
      const token = generateToken({ email });
      
      // 设置cookie
      res.setHeader('Set-Cookie', `token=${token}; Path=/; HttpOnly; Max-Age=${30 * 60}`);
      
      return res.status(200).json({ success: true });
    }

    res.status(401).json({ message: '邮箱或密码错误' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
} 
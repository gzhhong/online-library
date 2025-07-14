

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  console.log('Legacy register API called - this should be replaced with registerSuccess');
  return res.status(400).json({ error: '请使用新的注册流程' });
} 
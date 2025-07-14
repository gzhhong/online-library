

export default async function handler(req, res) {
  if (req.method !== 'PUT') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  console.log('Legacy update API called - this should be replaced with updateSuccess');
  return res.status(400).json({ error: '请使用新的更新流程' });
} 
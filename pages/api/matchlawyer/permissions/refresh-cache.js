import { withAuth, refreshMenuSettingsCache } from '@/lib/auth';

async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // 检查是否为超级管理员
    const { isSuperAdmin } = req.userData;
    
    if (!isSuperAdmin) {
      return res.status(403).json({ error: '只有超级管理员可以刷新缓存' });
    }

    // 刷新缓存
    await refreshMenuSettingsCache();
    
    res.status(200).json({
      success: true,
      message: '菜单设置缓存已刷新'
    });
  } catch (error) {
    console.error('刷新缓存失败:', error);
    res.status(500).json({ error: '刷新缓存失败' });
  }
}

export default withAuth(handler, '/api/matchlawyer/permissions/refresh-cache'); 
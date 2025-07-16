import { prisma } from '@/lib/db';
import { generateMenuId } from '@/lib/menuUtils';
import { verifyToken } from '@/lib/auth';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // 验证token和权限
    const token = req.cookies.token;
    if (!verifyToken(token)) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    // 检查是否已有菜单设置
    const existingMenus = await prisma.menuSetting.findMany();
    if (existingMenus.length > 0) {
      return res.status(400).json({ error: '菜单设置已存在，无需初始化' });
    }

    // 创建默认菜单设置
    const defaultMenus = [
      {
        id: '000000000000',
        title: '入口',
        path: '/matchlawyer/',
        level: 0,
        index: 0,
        icon: 'AccountTree',
        parentId: null,
        roleIds: JSON.stringify([]) // 所有角色都可访问
      },
      {
        id: generateMenuId(),
        title: '成员管理',
        path: '/matchlawyer/members',
        level: 1,
        index: 1,
        icon: 'People',
        parentId: '000000000000',
        roleIds: JSON.stringify([])
      },
      {
        id: generateMenuId(),
        title: '成员注册（测试用）',
        path: '/matchlawyer/register',
        level: 1,
        index: 2,
        icon: 'People',
        parentId: '000000000000',
        roleIds: JSON.stringify([])
      },
      {
        id: generateMenuId(),
        title: '权益管理',
        path: '/matchlawyer/benefit',
        level: 1,
        index: 3,
        icon: 'CardGiftcard',
        parentId: '000000000000',
        roleIds: JSON.stringify([])
      },
      {
        id: generateMenuId(),
        title: '系统设置',
        path: '/matchlawyer/settings',
        level: 1,
        index: 4,
        icon: 'Settings',
        parentId: '000000000000',
        roleIds: JSON.stringify([])
      }
    ];

    // 插入根菜单
    const createdMenus = await prisma.menuSetting.createMany({
      data: defaultMenus
    });

    // 获取创建的菜单以获取ID
    const level1Menus = await prisma.menuSetting.findMany({
      where: {
        parentId: '000000000000'
      }
    });

    // 创建子菜单
    const benefitMenu = level1Menus.find(m => m.title === '权益管理');
    const settingsMenu = level1Menus.find(m => m.title === '系统设置');

    const subMenus = [];

    if (benefitMenu) {
      subMenus.push(
        {
          id: generateMenuId(),
          title: '权益类型',
          path: '/matchlawyer/benefit/definetype',
          level: 2,
          index: 0,
          icon: null,
          parentId: benefitMenu.id,
          roleIds: JSON.stringify([])
        },
        {
          id: generateMenuId(),
          title: '权益分组',
          path: '/matchlawyer/benefit/group',
          level: 2,
          index: 1,
          icon: null,
          parentId: benefitMenu.id,
          roleIds: JSON.stringify([])
        },
        {
          id: generateMenuId(),
          title: '用户数据',
          path: '/matchlawyer/benefit/userdata',
          level: 2,
          index: 2,
          icon: null,
          parentId: benefitMenu.id,
          roleIds: JSON.stringify([])
        }
      );
    }

    if (settingsMenu) {
      subMenus.push(
        {
          id: generateMenuId(),
          title: '角色设置',
          path: '/matchlawyer/employeeroles',
          level: 2,
          index: 0,
          icon: null,
          parentId: settingsMenu.id,
          roleIds: JSON.stringify([])
        },
        {
          id: generateMenuId(),
          title: '员工管理',
          path: '/matchlawyer/employee',
          level: 2,
          index: 1,
          icon: null,
          parentId: settingsMenu.id,
          roleIds: JSON.stringify([])
        },
        {
          id: generateMenuId(),
          title: '权限设定',
          path: '/matchlawyer/menusetting',
          level: 2,
          index: 2,
          icon: null,
          parentId: settingsMenu.id,
          roleIds: JSON.stringify([])
        }
      );
    }

    if (subMenus.length > 0) {
      await prisma.menuSetting.createMany({
        data: subMenus
      });
    }

    res.status(200).json({
      success: true,
      message: '菜单设置初始化成功',
      data: {
        rootMenus: createdMenus.count,
        subMenus: subMenus.length
      }
    });

  } catch (error) {
    console.error('初始化菜单设置错误:', error);
    res.status(500).json({ error: '服务器内部错误' });
  }
} 
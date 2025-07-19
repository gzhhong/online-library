import { generateMenuId } from './menuUtils';
const rootMenuId = '000000000000';

// 默认菜单数据
export const getDefaultMenuData = () => {
  const defaultMenus = [
    {
      id: rootMenuId,
      title: '入口',
      path: '/matchlawyer/',
      level: 0,
      index: 0,
      icon: 'AccountTree',
      parentId: null,
      roleIds: JSON.stringify([])
    },
    {
      id: generateMenuId(),
      title: '行业标签管理',
      path: '/matchlawyer/industries',
      level: 1,
      index: 0,
      icon: 'AccountTree',
      parentId: rootMenuId,
      roleIds: JSON.stringify([])
    },
    {
      id: generateMenuId(),
      title: '成员管理',
      path: '/matchlawyer/members',
      level: 1,
      index: 1,
      icon: 'People',
      parentId: rootMenuId,
      roleIds: JSON.stringify([])
    },
    {
      id: generateMenuId(),
      title: '成员注册（测试用）',
      path: '/matchlawyer/register',
      level: 1,
      index: 2,
      icon: 'People',
      parentId: rootMenuId,
      roleIds: JSON.stringify([])
    },
    {
      id: generateMenuId(),
      title: '权益管理',
      path: '/matchlawyer/benefit',
      level: 1,
      index: 3,
      icon: 'CardGiftcard',
      parentId: rootMenuId,
      roleIds: JSON.stringify([])
    },
    {
      id: generateMenuId(),
      title: '系统设置',
      path: '/matchlawyer/settings',
      level: 1,
      index: 4,
      icon: 'Settings',
      parentId: rootMenuId,
      roleIds: JSON.stringify([])
    },
    {
      id: generateMenuId(),
      title: '活动管理',
      path: '/matchlawyer/activities',
      level: 1,
      index: 5,
      icon: 'Assignment',
      parentId: rootMenuId,
      roleIds: JSON.stringify([])
    }
  ];

  // 获取权益管理和系统设置菜单的ID
  const benefitMenu = defaultMenus.find(m => m.title === '权益管理');
  const settingsMenu = defaultMenus.find(m => m.title === '系统设置');

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
        path: '/matchlawyer/settings/employeeroles',
        level: 2,
        index: 0,
        icon: null,
        parentId: settingsMenu.id,
        roleIds: JSON.stringify([])
      },
      {
        id: generateMenuId(),
        title: '员工管理',
        path: '/matchlawyer/settings/employee',
        level: 2,
        index: 1,
        icon: null,
        parentId: settingsMenu.id,
        roleIds: JSON.stringify([])
      },
      {
        id: generateMenuId(),
        title: '权限设定',
        path: '/matchlawyer/settings/menusetting',
        level: 2,
        index: 2,
        icon: null,
        parentId: settingsMenu.id,
        roleIds: JSON.stringify([])
      }
    );
  }

  return {
    rootMenus: defaultMenus,
    subMenus: subMenus,
    allMenus: [...defaultMenus, ...subMenus]
  };
};

// 统一的图标映射函数
export const iconMapper = (iconName) => {
  const iconMap = {
    AccountTree: 'AccountTree',
    Settings: 'Settings',
    People: 'People',
    CardGiftcard: 'CardGiftcard',
    Logout: 'Logout',
    Assignment: 'Assignment'
  };
  return iconMap[iconName] || null;
};

// React组件图标映射函数
export const reactIconMapper = (iconName) => {
  const { AccountTree, Settings, People, CardGiftcard, Logout, Assignment } = require('@mui/icons-material');
  const iconMap = {
    AccountTree: <AccountTree />,
    Settings: <Settings />,
    People: <People />,
    CardGiftcard: <CardGiftcard />,
    Logout: <Logout />,
    Assignment: <Assignment />
  };
  return iconMap[iconName] || null;
}; 
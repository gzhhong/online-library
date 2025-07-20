const { addRoles, addEmployees, addDefaultMenus, clearPermissionData } = require('./dbInit');

// 只添加角色
async function setupRoles() {
  console.log('🔧 设置角色数据...');
  return await addRoles();
}

// 只添加员工
async function setupEmployees(roles) {
  console.log('🔧 设置员工数据...');
  return await addEmployees(roles);
}

// 只添加菜单
async function setupMenus(roles) {
  console.log('🔧 设置菜单数据...');
  return await addDefaultMenus(roles);
}

// 设置完整的权限测试环境
async function setupPermissionTestEnv() {
  console.log('🔧 设置权限测试环境...');
  
  // 清空现有数据
  await clearPermissionData();
  
  // 按顺序创建数据
  const roles = await setupRoles();
  const employees = await setupEmployees(roles);
  const menus = await setupMenus(roles);
  
  return {
    roles,
    employees,
    menus
  };
}

// 获取测试账号信息
function getTestAccounts() {
  return {
    admin: {
      email: 'zhangsan@test.com',
      password: 'abcd1234',
      name: '张三',
      role: 'admin'
    },
    operator: {
      email: 'lisi@test.com',
      password: 'abcd1234',
      name: '李四',
      role: 'operator'
    }
  };
}

// 验证权限配置
async function verifyPermissionSetup() {
  const { getRoles, getEmployees, getMenus } = require('./dbInit');
  
  const roles = await getRoles();
  const employees = await getEmployees();
  const menus = await getMenus();
  
  console.log('🔍 权限配置验证:');
  console.log(`   - 角色数量: ${roles.length}`);
  console.log(`   - 员工数量: ${employees.length}`);
  console.log(`   - 菜单数量: ${menus.length}`);
  
  // 验证关键数据
  const adminRole = roles.find(r => r.name === 'admin');
  const operatorRole = roles.find(r => r.name === 'operator');
  const settingMenu = menus.find(m => m.title === 'Setting');
  
  if (!adminRole || !operatorRole) {
    throw new Error('缺少必要的角色数据');
  }
  
  if (!settingMenu) {
    throw new Error('缺少Setting菜单');
  }
  
  // 验证Setting菜单只有admin权限
  const settingRoleIds = JSON.parse(settingMenu.roleIds);
  if (!settingRoleIds.includes(adminRole.id) || settingRoleIds.includes(operatorRole.id)) {
    throw new Error('Setting菜单权限配置错误');
  }
  
  console.log('✅ 权限配置验证通过');
  
  return {
    roles,
    employees,
    menus,
    adminRole,
    operatorRole,
    settingMenu
  };
}

module.exports = {
  setupRoles,
  setupEmployees,
  setupMenus,
  setupPermissionTestEnv,
  getTestAccounts,
  verifyPermissionSetup
}; 
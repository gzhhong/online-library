const { PrismaClient } = require('@prisma/client');
const { generateMenuId } = require('../../lib/menuUtils');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

// 添加角色
async function addRoles() {
  console.log('👥 创建员工角色...');
  
  const roles = [
    { name: 'admin', description: '最高权限' },
    { name: 'operator', description: '运营权限' },
    { name: 'user', description: '普通权限' }
  ];
  
  const createdRoles = [];
  for (const role of roles) {
    // 检查角色是否已存在
    let existingRole = await prisma.employeeRoles.findFirst({
      where: { name: role.name }
    });
    
    if (existingRole) {
      console.log(`✅ 角色已存在: ${role.name} (ID: ${existingRole.id})`);
      createdRoles.push(existingRole);
    } else {
      const createdRole = await prisma.employeeRoles.create({
        data: role
      });
      createdRoles.push(createdRole);
      console.log(`✅ 创建角色: ${role.name} (ID: ${createdRole.id})`);
    }
  }
  
  return createdRoles;
}

// 添加员工
async function addEmployees(roles) {
  console.log('👤 创建员工...');
  
  const adminRole = roles.find(r => r.name === 'admin');
  const operatorRole = roles.find(r => r.name === 'operator');
  
  const employees = [
    {
      name: '张三',
      email: 'zhangsan@test.com',
      phone: '13100000000',
      password: 'abcd1234',
      roleId: adminRole.id,
      status: 1
    },
    {
      name: '李四',
      email: 'lisi@test.com',
      phone: '13200000000',
      password: 'abcd1234',
      roleId: operatorRole.id,
      status: 1
    }
  ];
  
  const createdEmployees = [];
  for (const employee of employees) {
    // 检查员工是否已存在
    let existingEmployee = await prisma.employee.findFirst({
      where: { email: employee.email }
    });
    
    if (existingEmployee) {
      console.log(`✅ 员工已存在: ${employee.name} (${employee.email})`);
      createdEmployees.push(existingEmployee);
    } else {
      const hashedPassword = await bcrypt.hash(employee.password, 10);
      const createdEmployee = await prisma.employee.create({
        data: {
          ...employee,
          password: hashedPassword
        }
      });
      createdEmployees.push(createdEmployee);
      console.log(`✅ 创建员工: ${employee.name} (${employee.email})`);
    }
  }
  
  return createdEmployees;
}

// 添加权益类型
async function addBenefitTypes() {
  console.log('🎁 创建权益类型...');
  
  const benefitTypes = [
    { id: '000001', title: '会议', isPaid: true },
    { id: '000002', title: '培训', isPaid: true },
    { id: '000003', title: '会议', isPaid: false },
    { id: '000004', title: '培训', isPaid: false }
  ];
  
  const createdBenefitTypes = [];
  for (const benefitType of benefitTypes) {
    // 检查权益类型是否已存在
    let existingBenefitType = await prisma.benefitType.findFirst({
      where: { id: benefitType.id }
    });
    
    if (existingBenefitType) {
      console.log(`✅ 权益类型已存在: ${benefitType.title} (ID: ${benefitType.id})`);
      createdBenefitTypes.push(existingBenefitType);
    } else {
      const createdBenefitType = await prisma.benefitType.create({
        data: benefitType
      });
      createdBenefitTypes.push(createdBenefitType);
      console.log(`✅ 创建权益类型: ${benefitType.title} (ID: ${benefitType.id}, 收费: ${benefitType.isPaid})`);
    }
  }
  
  return createdBenefitTypes;
}

// 添加权益分组数据
async function addBenefitGroups() {
  console.log('📦 创建权益分组...');
  
  // 先创建权益类型
  await addBenefitTypes();
  
  const benefitGroups = [
    { groupId: 'AAAAAA', title: '免费会员', benefitTypeId: '000003', times: 3, description: '免费会员 - 律师', price: 0, notShow: false, forWhom: '律师' },
    { groupId: 'AAAAAA', title: '免费会员', benefitTypeId: '000004', times: 3, description: '免费会员 - 律师', price: 0, notShow: false, forWhom: '律师' },
    { groupId: 'BBBBBB', title: '一星会员', benefitTypeId: '000001', times: 3, description: '一星会员 - 律师', price: 200, notShow: false, forWhom: '律师' },
    { groupId: 'BBBBBB', title: '一星会员', benefitTypeId: '000002', times: 3, description: '一星会员 - 律师', price: 200, notShow: false, forWhom: '律师' },
    { groupId: 'CCCCCC', title: '免费会员', benefitTypeId: '000003', times: 3, description: '免费会员-企业', price: 0, notShow: false, forWhom: '企业' }
  ];
  
  const createdBenefitGroups = [];
  for (const benefitGroup of benefitGroups) {
    // 检查权益分组是否已存在（基于groupId和benefitTypeId的组合）
    let existingBenefitGroup = await prisma.benefitGroup.findFirst({
      where: { 
        groupId: benefitGroup.groupId,
        benefitTypeId: benefitGroup.benefitTypeId
      }
    });
    
    if (existingBenefitGroup) {
      console.log(`✅ 权益分组已存在: ${benefitGroup.title} (GroupID: ${benefitGroup.groupId}, TypeID: ${benefitGroup.benefitTypeId})`);
      createdBenefitGroups.push(existingBenefitGroup);
    } else {
      const createdBenefitGroup = await prisma.benefitGroup.create({
        data: benefitGroup
      });
      createdBenefitGroups.push(createdBenefitGroup);
      console.log(`✅ 创建权益分组: ${benefitGroup.title} (GroupID: ${benefitGroup.groupId}, TypeID: ${benefitGroup.benefitTypeId})`);
    }
  }
  
  return createdBenefitGroups;
}

// 添加默认菜单
async function addDefaultMenus(roles) {
  console.log('📋 创建菜单设置...');
  
  const adminRole = roles.find(r => r.name === 'admin');
  const operatorRole = roles.find(r => r.name === 'operator');
  const rootMenuId = '000000000000';
  
  const defaultMenus = [
    {
      id: rootMenuId,
      title: '入口',
      path: '/matchlawyer/',
      level: 0,
      index: 0,
      icon: 'AccountTree',
      parentId: null,
      roleIds: JSON.stringify([adminRole.id, operatorRole.id])
    },
    {
      id: generateMenuId(),
      title: 'Tag Management',
      path: '/matchlawyer/industries',
      level: 1,
      index: 0,
      icon: 'AccountTree',
      parentId: rootMenuId,
      roleIds: JSON.stringify([adminRole.id, operatorRole.id])
    },
    {
      id: generateMenuId(),
      title: 'Member',
      path: '/matchlawyer/members',
      level: 1,
      index: 1,
      icon: 'People',
      parentId: rootMenuId,
      roleIds: JSON.stringify([adminRole.id, operatorRole.id])
    },
    {
      id: generateMenuId(),
      title: '成员注册（测试用）',
      path: '/matchlawyer/register',
      level: 1,
      index: 2,
      icon: 'People',
      parentId: rootMenuId,
      roleIds: JSON.stringify([adminRole.id, operatorRole.id])
    },
    {
      id: generateMenuId(),
      title: '权益管理',
      path: '/matchlawyer/benefit',
      level: 1,
      index: 3,
      icon: 'CardGiftcard',
      parentId: rootMenuId,
      roleIds: JSON.stringify([adminRole.id, operatorRole.id])
    },
    {
      id: generateMenuId(),
      title: 'Setting',
      path: '/matchlawyer/settings',
      level: 1,
      index: 4,
      icon: 'Settings',
      parentId: rootMenuId,
      roleIds: JSON.stringify([adminRole.id])
    },
    {
      id: generateMenuId(),
      title: '活动管理',
      path: '/matchlawyer/activities',
      level: 1,
      index: 5,
      icon: 'Assignment',
      parentId: rootMenuId,
      roleIds: JSON.stringify([adminRole.id, operatorRole.id])
    }
  ];
  
  // 检查菜单是否已存在
  const existingMenus = await prisma.menuSetting.findMany();
  if (existingMenus.length > 0) {
    console.log(`✅ 菜单已存在: ${existingMenus.length} 个`);
    return existingMenus;
  }
  
  // 先创建一级菜单
  await prisma.menuSetting.createMany({
    data: defaultMenus
  });
  
  // 获取权益管理和系统设置菜单的ID
  const benefitMenu = defaultMenus.find(m => m.title === '权益管理');
  const settingsMenu = defaultMenus.find(m => m.title === 'Setting');
  
  // 创建子菜单
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
        roleIds: JSON.stringify([adminRole.id, operatorRole.id])
      },
      {
        id: generateMenuId(),
        title: '权益分组',
        path: '/matchlawyer/benefit/group',
        level: 2,
        index: 1,
        icon: null,
        parentId: benefitMenu.id,
        roleIds: JSON.stringify([adminRole.id, operatorRole.id])
      },
      {
        id: generateMenuId(),
        title: '用户数据',
        path: '/matchlawyer/benefit/userdata',
        level: 2,
        index: 2,
        icon: null,
        parentId: benefitMenu.id,
        roleIds: JSON.stringify([adminRole.id, operatorRole.id])
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
        roleIds: JSON.stringify([adminRole.id])
      },
      {
        id: generateMenuId(),
        title: '员工管理',
        path: '/matchlawyer/settings/employee',
        level: 2,
        index: 1,
        icon: null,
        parentId: settingsMenu.id,
        roleIds: JSON.stringify([adminRole.id])
      },
      {
        id: generateMenuId(),
        title: '权限设定',
        path: '/matchlawyer/settings/menusetting',
        level: 2,
        index: 2,
        icon: null,
        parentId: settingsMenu.id,
        roleIds: JSON.stringify([adminRole.id])
      }
    );
  }
  
  // 创建子菜单
  if (subMenus.length > 0) {
    await prisma.menuSetting.createMany({
      data: subMenus
    });
  }
  
  const totalMenus = defaultMenus.length + subMenus.length;
  console.log(`✅ 创建菜单: ${totalMenus} 个 (一级菜单: ${defaultMenus.length}, 子菜单: ${subMenus.length})`);
  
  return [...defaultMenus, ...subMenus];
}

// 清空权限相关数据
async function clearPermissionData() {
  console.log('🧹 清空权限相关数据...');
  
  await prisma.employee.deleteMany();
  await prisma.employeeRoles.deleteMany();
  await prisma.menuSetting.deleteMany();
  
  console.log('✅ 权限数据清空完成');
}

// 初始化完整的权限数据
async function initPermissionData() {
  try {
    console.log('🚀 开始初始化权限数据...');
    
    // 1. 清空现有数据
    await clearPermissionData();
    
    // 2. 创建角色
    const roles = await addRoles();
    
    // 3. 创建员工
    const employees = await addEmployees(roles);
    
    const menus = await addDefaultMenus(roles);
    
    // 6. 验证数据
    console.log('🔍 验证数据...');
    const roleCount = await prisma.employeeRoles.count();
    const employeeCount = await prisma.employee.count();
    const menuCount = await prisma.menuSetting.count();
    
    console.log('📊 数据统计:');
    console.log(`   - 角色: ${roleCount} 个`);
    console.log(`   - 员工: ${employeeCount} 个`);
    console.log(`   - 菜单: ${menuCount} 个`);
    
    console.log('\n🎉 权限数据初始化完成！');
    console.log('\n📝 测试账号信息:');
    console.log('   张三 (admin): zhangsan@test.com / abcd1234');
    console.log('   李四 (operator): lisi@test.com / abcd1234');
    
    return {
      roles,
      employees,
      menus
    };
    
  } catch (error) {
    console.error('❌ 初始化失败:', error);
    throw error;
  }
}

// 获取角色信息
async function getRoles() {
  return await prisma.employeeRoles.findMany();
}

// 获取员工信息
async function getEmployees() {
  return await prisma.employee.findMany({
    include: {
      role: true
    }
  });
}

// 获取菜单信息
async function getMenus() {
  return await prisma.menuSetting.findMany();
}

// 获取权益类型信息
async function getBenefitTypes() {
  return await prisma.benefitType.findMany();
}

// 获取权益分组信息
async function getBenefitGroups() {
  return await prisma.benefitGroup.findMany({
    include: {
      benefitType: true
    }
  });
}

module.exports = {
  addRoles,
  addEmployees,
  addBenefitTypes,
  addBenefitGroups,
  addDefaultMenus,
  clearPermissionData,
  initPermissionData,
  getRoles,
  getEmployees,
  getBenefitTypes,
  getBenefitGroups,
  getMenus,
  prisma
}; 
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// 需要清空的表列表（按依赖关系排序，先清空子表）
const TABLES_TO_CLEAR = [
  'ActivityMember',
  'BenefitConsumed', 
  'BenefitGroup',
  'Activity',
  'Member',
  'Employee',
  'BenefitType',
  'Industry',
  'MenuSetting',
  'EmployeeRoles'
];

async function clearTestData() {
  try {
    console.log('🧹 开始清空测试数据...');
    
    // 按顺序清空表，避免外键约束问题
    for (const tableName of TABLES_TO_CLEAR) {
      try {
        // 使用原生SQL清空表
        await prisma.$executeRawUnsafe(`DELETE FROM ${tableName}`);
        console.log(`✅ 已清空表: ${tableName}`);
      } catch (error) {
        console.log(`⚠️  清空表 ${tableName} 时出错:`, error.message);
      }
    }
    
    console.log('✅ 测试数据清空完成');
    
  } catch (error) {
    console.error('❌ 清空测试数据失败:', error);
    throw error;
  }
}

module.exports = {
  clearTestData,
  prisma
}; 
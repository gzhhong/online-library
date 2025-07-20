const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testEnvironment() {
  try {
    console.log('🧪 测试环境验证开始...');
    
    // 检查数据库连接
    console.log('1. 检查数据库连接...');
    await prisma.$connect();
    console.log('✅ 数据库连接成功');
    
    // 检查表是否存在
    console.log('2. 检查表结构...');
    const tables = await prisma.$queryRaw`
      SELECT TABLE_NAME 
      FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_SCHEMA = 'mockdb'
    `;
    
    console.log('✅ 发现以下表:');
    tables.forEach(table => {
      console.log(`   - ${table.TABLE_NAME}`);
    });
    
    // 检查BenefitGroup表结构
    console.log('3. 检查BenefitGroup表结构...');
    const benefitGroupColumns = await prisma.$queryRaw`
      SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_DEFAULT
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = 'mockdb' AND TABLE_NAME = 'BenefitGroup'
      ORDER BY ORDINAL_POSITION
    `;
    
    console.log('✅ BenefitGroup表结构:');
    benefitGroupColumns.forEach(col => {
      console.log(`   - ${col.COLUMN_NAME}: ${col.DATA_TYPE} ${col.IS_NULLABLE === 'YES' ? '(nullable)' : '(not null)'} ${col.COLUMN_DEFAULT ? `default: ${col.COLUMN_DEFAULT}` : ''}`);
    });
    
    // 检查唯一约束
    console.log('4. 检查唯一约束...');
    const uniqueConstraints = await prisma.$queryRaw`
      SELECT CONSTRAINT_NAME, COLUMN_NAME
      FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE 
      WHERE TABLE_SCHEMA = 'mockdb' 
        AND TABLE_NAME = 'BenefitGroup' 
        AND CONSTRAINT_NAME LIKE '%unique%'
    `;
    
    if (uniqueConstraints.length > 0) {
      console.log('✅ 发现唯一约束:');
      uniqueConstraints.forEach(constraint => {
        console.log(`   - ${constraint.CONSTRAINT_NAME}: ${constraint.COLUMN_NAME}`);
      });
    } else {
      console.log('⚠️  未发现唯一约束');
    }
    
    // 测试插入数据
    console.log('5. 测试数据插入...');
    
    // 先创建BenefitType
    const testBenefitType = await prisma.benefitType.create({
      data: {
        id: 'TYPE01',
        title: '测试权益类型',
        isPaid: false
      }
    });
    console.log('✅ 测试BenefitType创建成功:', testBenefitType.id);
    
    // 创建BenefitGroup
    const testGroup = await prisma.benefitGroup.create({
      data: {
        groupId: 'TEST01',
        title: '测试权益组',
        benefitTypeId: 'TYPE01',
        times: 1,
        description: '测试描述',
        price: 0,
        notShow: false,
        forWhom: '律师'
      }
    });
    console.log('✅ 测试BenefitGroup创建成功:', testGroup.id);
    
    // 测试查询数据
    const foundGroup = await prisma.benefitGroup.findFirst({
      where: { groupId: 'TEST01' },
      include: { benefitType: true }
    });
    console.log('✅ 测试数据查询成功:', foundGroup.title, '关联权益类型:', foundGroup.benefitType.title);
    
    // 清理测试数据
    await prisma.benefitGroup.delete({
      where: { id: testGroup.id }
    });
    await prisma.benefitType.delete({
      where: { id: 'TYPE01' }
    });
    console.log('✅ 测试数据清理完成');
    
    console.log('\n🎉 测试环境验证完成！所有功能正常。');
    
  } catch (error) {
    console.error('❌ 测试环境验证失败:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

testEnvironment(); 
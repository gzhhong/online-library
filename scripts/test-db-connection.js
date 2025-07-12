const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testDatabaseConnection() {
  try {
    console.log('开始测试数据库连接...');
    
    // 1. 测试基本连接
    console.log('1. 测试Prisma客户端连接...');
    await prisma.$connect();
    console.log('✅ Prisma客户端连接成功');

    // 2. 检查Prisma客户端模型
    console.log('2. 检查Prisma客户端模型...');
    console.log('可用的模型:', Object.keys(prisma));
    
    if (!prisma.industry) {
      console.log('❌ Industry模型不存在，需要重新生成Prisma客户端');
      console.log('请运行: npx prisma generate');
      return;
    }
    console.log('✅ Industry模型存在');

    // 3. 测试数据库连接
    console.log('3. 测试数据库连接...');
    const result = await prisma.$queryRaw`SELECT 1 as test`;
    console.log('✅ 数据库连接成功:', result);

    // 4. 检查Industry表是否存在
    console.log('4. 检查Industry表是否存在...');
    try {
      const tables = await prisma.$queryRaw`
        SELECT TABLE_NAME 
        FROM INFORMATION_SCHEMA.TABLES 
        WHERE TABLE_SCHEMA = DATABASE() 
        AND TABLE_NAME = 'Industry'
      `;
      
      if (tables.length > 0) {
        console.log('✅ Industry表存在');
        
        // 5. 检查Industry表结构
        console.log('5. 检查Industry表结构...');
        const columns = await prisma.$queryRaw`
          SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_DEFAULT
          FROM INFORMATION_SCHEMA.COLUMNS 
          WHERE TABLE_SCHEMA = DATABASE() 
          AND TABLE_NAME = 'Industry'
          ORDER BY ORDINAL_POSITION
        `;
        
        console.log('Industry表结构:');
        columns.forEach(col => {
          console.log(`  - ${col.COLUMN_NAME}: ${col.DATA_TYPE} ${col.IS_NULLABLE === 'YES' ? '(NULL)' : '(NOT NULL)'} ${col.COLUMN_DEFAULT ? `DEFAULT: ${col.COLUMN_DEFAULT}` : ''}`);
        });
        
        // 6. 检查Industry表数据
        console.log('6. 检查Industry表数据...');
        try {
          const count = await prisma.industry.count();
          console.log(`✅ Industry表中有 ${count} 条记录`);
          
          if (count > 0) {
            const sampleData = await prisma.industry.findMany({
              take: 3,
              orderBy: { createdAt: 'asc' }
            });
            console.log('示例数据:');
            sampleData.forEach(item => {
              console.log(`  - ID: ${item.id}, Title: ${item.title}, Level: ${item.level}`);
            });
          }
        } catch (error) {
          console.log('❌ 查询Industry表数据时出错:', error.message);
        }
        
      } else {
        console.log('❌ Industry表不存在');
        console.log('需要运行数据库迁移: npx prisma migrate dev');
      }
      
    } catch (error) {
      console.log('❌ 检查Industry表时出错:', error.message);
    }

    // 7. 检查User表
    console.log('7. 检查User表...');
    try {
      const userCount = await prisma.user.count();
      console.log(`✅ User表中有 ${userCount} 条记录`);
      
      if (userCount > 0) {
        const users = await prisma.user.findMany({
          take: 5,
          orderBy: { id: 'asc' }
        });
        console.log('用户列表:');
        users.forEach(user => {
          console.log(`  - ID: ${user.id}, NickName: ${user.nickName}, AccessLevel: ${user.accessLevel}`);
        });
      }
    } catch (error) {
      console.log('❌ 检查User表时出错:', error.message);
    }

    // 8. 测试环境变量
    console.log('8. 检查环境变量...');
    console.log('DATABASE_URL:', process.env.DATABASE_URL ? '已设置' : '未设置');
    console.log('ADMIN_EMAIL:', process.env.ADMIN_EMAIL ? '已设置' : '未设置');
    console.log('ADMIN_PASSWORD:', process.env.ADMIN_PASSWORD ? '已设置' : '未设置');
    console.log('JWT_SECRET:', process.env.JWT_SECRET ? '已设置' : '未设置');

  } catch (error) {
    console.error('❌ 数据库连接测试失败:', error);
    
    // 提供详细的错误信息和建议
    if (error.code === 'P1001') {
      console.log('建议: 检查DATABASE_URL环境变量是否正确设置');
    } else if (error.code === 'P1002') {
      console.log('建议: 检查数据库服务器是否运行');
    } else if (error.code === 'P1008') {
      console.log('建议: 检查数据库用户名和密码是否正确');
    } else if (error.code === 'P1009') {
      console.log('建议: 检查数据库是否存在');
    } else if (error.code === 'P1017') {
      console.log('建议: 检查数据库连接是否被拒绝');
    }
    
    console.log('可能的解决方案:');
    console.log('1. 检查 .env 文件中的 DATABASE_URL');
    console.log('2. 确保数据库服务器正在运行');
    console.log('3. 运行 npx prisma migrate dev 创建表');
    console.log('4. 运行 npx prisma generate 生成客户端');
    
  } finally {
    await prisma.$disconnect();
    console.log('数据库连接已关闭');
  }
}

// 运行测试
testDatabaseConnection(); 
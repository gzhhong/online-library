const { spawn } = require('child_process');
const path = require('path');

// 设置测试环境变量
process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = 'mysql://root:example@localhost:3306/mockdb';

// 加载测试环境配置
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local.test') });

console.log('🚀 启动E2E测试流程...');
console.log(`📊 使用数据库: ${process.env.DATABASE_URL}`);

let testServer = null;
let testProcess = null;

// 启动测试服务器
function startTestServer() {
  return new Promise((resolve, reject) => {
    console.log('🔧 启动测试专用开发服务器...');
    
    testServer = spawn('npx', ['next', 'dev', '--port', '3001'], {
      stdio: 'pipe',
      env: {
        ...process.env,
        PORT: '3001'
      }
    });

    testServer.stdout.on('data', (data) => {
      const output = data.toString();
      console.log(`[服务器] ${output.trim()}`);
      
      // 检查服务器是否启动成功
      if (output.includes('ready started server') || output.includes('Local:')) {
        console.log('✅ 测试服务器启动成功！');
        setTimeout(resolve, 2000); // 等待2秒确保服务器完全启动
      }
    });

    testServer.stderr.on('data', (data) => {
      const output = data.toString();
      if (!output.includes('Warning') && !output.includes('DeprecationWarning')) {
        console.error(`[服务器错误] ${output.trim()}`);
      }
    });

    testServer.on('error', (error) => {
      console.error('❌ 启动测试服务器失败:', error);
      reject(error);
    });

    // 设置超时
    setTimeout(() => {
      if (testServer && !testServer.killed) {
        console.log('⏰ 服务器启动超时，继续执行测试...');
        resolve();
      }
    }, 30000);
  });
}

// 运行Playwright测试
function runTests() {
  return new Promise((resolve, reject) => {
    console.log('🧪 开始运行Playwright测试...');
    
    // 获取命令行参数，支持指定测试文件
    const testArgs = process.argv.slice(2);
    const playwrightArgs = ['playwright', 'test'];
    
    if (testArgs.length > 0) {
      playwrightArgs.push(...testArgs);
      console.log(`🎯 运行指定测试: ${testArgs.join(' ')}`);
    } else {
      console.log('🎯 运行所有测试');
    }
    
    testProcess = spawn('npx', playwrightArgs, {
      stdio: 'inherit',
      env: {
        ...process.env,
        NODE_ENV: 'test'
      }
    });

    testProcess.on('close', (code) => {
      console.log(`🧪 测试完成，退出码: ${code}`);
      resolve(code);
    });

    testProcess.on('error', (error) => {
      console.error('❌ 运行测试失败:', error);
      reject(error);
    });
  });
}

// 清理资源
function cleanup() {
  console.log('🧹 清理资源...');
  
  if (testProcess && !testProcess.killed) {
    console.log('🛑 停止测试进程...');
    testProcess.kill('SIGTERM');
  }
  
  if (testServer && !testServer.killed) {
    console.log('🛑 停止测试服务器...');
    testServer.kill('SIGTERM');
    
    // 强制关闭服务器进程
    setTimeout(() => {
      if (testServer && !testServer.killed) {
        console.log('🔨 强制关闭测试服务器...');
        testServer.kill('SIGKILL');
      }
    }, 5000);
  }
}

// 主流程
async function main() {
  try {
    await startTestServer();
    const exitCode = await runTests();
    
    // 测试完成后清理资源
    console.log('🧹 测试完成，正在清理资源...');
    cleanup();
    
    // 等待清理完成
    setTimeout(() => {
      console.log('✅ 清理完成，退出程序');
      process.exit(exitCode);
    }, 2000);
    
  } catch (error) {
    console.error('❌ 测试流程失败:', error);
    cleanup();
    process.exit(1);
  }
}

// 处理进程退出
process.on('SIGINT', () => {
  console.log('\n🛑 收到中断信号，正在停止...');
  cleanup();
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 收到终止信号，正在停止...');
  cleanup();
  process.exit(0);
});

// 启动主流程
main(); 
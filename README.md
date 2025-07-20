# 在线图书馆系统

## 1. 重要改变

### 弃用 cos-js-sdk-v5

这个库使用的 API 参考：https://developers.weixin.qq.com/miniprogram/dev/wxcloudservice/wxcloudrun/src/development/storage/service/cos-sdk.html
它的问题是只能接受小于 1.1M 的文件。

#### 原因和调试过程：

这个后端系统是部署在云托管服务上的，而云托管服务是基于腾讯云的云函数，而腾讯云的云函数是基于腾讯云的 COS 服务。
从公网入口到 COS 服务，再到云函数，再到后端系统，中间有多个环节，其中某个环节将 request 请求的 body 限制为 1.1M。
因此如果需要上传大于 1.1M 的文件，浏览器会直接收到 413 错误，而请求根本到达不了后端系统。

调试时，我发现上传大文件时，在 handler 入口的 log 都无法打印，因此问题出在后端服务之前的某个中间服务器上。而这个
服务器是在开发者控制之外的。

所以，从 commit 116c94f65b783df15ccb04568afe3e40662e9b15 开始，转而使用 https://developers.weixin.qq.com/miniprogram/dev/wxcloudservice/wxcloudrun/src/development/storage/service/upload.html
提供的 uploadFile 方法。

这个方法的实现在 116c94f65b783df15ccb04568afe3e40662e9b15 至 93da9a453653c652833b9175c1b331a29bdd2b9c 之间。

### 注意事项

1. 确保传入的 path 不以/开头，否则会报错。如果上传到非根目录，比如想传文件到/covers/test.jpg，请求参数 path 要写成
   covers/test.jpg。而不能是/covers/test.jpg。

2. 如果上传到非根目录，需要在服务端先把目录创建好。比如想要穿到/covers/目录下，需要在服务端先把目录创建好。比如
   想要传到/covers/目录下，则需要先在服务端把 covers 目录创建好，否则会出错。另一个问题是，当 covers 目录下没有文件的时候，系统会自动删除 covers
   目录，这样导致下次再上传文件，又要出错。我的 workaround 是，在 covers 目录，创建一个空的 index.html 文件，这样系统就不会
   自动删除这个目录了。

## 2. MatchLawyer 系统

### 系统概述

MatchLawyer 是一个标签管理系统，与原有的在线图书馆系统部署在同一个 Next.js 应用中，通过路径前缀区分：

- 在线图书馆：`/admin/*` 和 `/api/admin/*`
- MatchLawyer：`/matchlawyer/*` 和 `/api/matchlawyer/*`

### 功能特性

- **标签管理**：支持多层级标签的创建、编辑、删除
- **树形结构**：使用 React Flow 实现可视化的树形结构
- **拖拽操作**：支持拖拽改变标签层级关系
- **自动认证**：与 admin 系统共享 0 号用户认证

### 数据库结构

新增`Industry`模型用于存储标签信息：

```prisma
model Industry {
  id          String   @id @db.VarChar(12)
  title       String   @db.VarChar(100)
  description String?  @db.Text
  level       Int      @default(0)
  parentId    String?  @db.VarChar(12)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  parent      Industry? @relation("IndustryHierarchy", fields: [parentId], references: [id], onDelete: SetNull)
  children    Industry[] @relation("IndustryHierarchy")
}
```

### 部署问题解决

#### 问题描述

在开发环境中添加 Industry 模型后，运行`npm run test-db`时出现错误：

```
❌ 检查Industry表时出错: Cannot read properties of undefined (reading 'count')
```

#### 问题原因

Prisma 客户端没有重新生成，导致`prisma.industry`模型不存在。

#### 解决过程

1. **诊断问题**：创建了`scripts/test-db-connection.js`测试脚本
2. **发现问题**：Prisma 客户端中缺少 Industry 模型
3. **解决方案**：运行`npx prisma generate`重新生成客户端
4. **验证修复**：再次运行测试脚本确认问题解决

#### 测试脚本功能

`npm run test-db` 可以检查：

- 数据库连接状态
- Prisma 客户端模型完整性
- 表结构和数据
- 环境变量配置

### 部署到腾讯云 MySQL

#### 本地开发环境

```bash
# 生成Prisma客户端
npx prisma generate

# 运行数据库迁移
npx prisma migrate dev --name add-industry-model

# 测试数据库连接
npm run test-db
```

#### 生产环境部署

1. **环境变量配置**：

   ```bash
   DATABASE_URL="mysql://username:password@host:port/database"
   ADMIN_EMAIL="your-admin-email"
   ADMIN_PASSWORD="your-admin-password"
   JWT_SECRET="your-jwt-secret"
   ```

2. **数据库迁移**：

   ```bash
   # 生产环境迁移（不会自动应用）
   npx prisma migrate deploy

   # 或者手动应用迁移
   npx prisma db push
   ```

3. **生成客户端**：

   ```bash
   npx prisma generate
   ```

4. **构建和部署**：
   ```bash
   npm run build
   npm start
   ```

#### 注意事项

- `npx prisma generate` 是本地操作，生成客户端代码
- `npx prisma migrate deploy` 是远程操作，应用到生产数据库
- 确保生产环境的 DATABASE_URL 指向腾讯云 MySQL 实例
- 建议在部署前先在本地测试所有功能

关键区别：
npx prisma generate：生成 TypeScript 客户端代码，在本地执行
npx prisma migrate deploy：将迁移应用到远程数据库，在服务器上执行
npx prisma db push：直接将 schema 推送到数据库，跳过迁移历史
腾讯云部署建议：
使用迁移：npx prisma migrate deploy 更安全，有版本控制
环境隔离：确保生产环境的 DATABASE_URL 指向腾讯云实例
权限配置：确保数据库用户有足够的权限执行迁移
备份策略：在应用迁移前备份生产数据库
这样就能正确地将 MatchLawyer 系统部署到腾讯云 MySQL 实例上了

服务器上可以执行语句：
CREATE TABLE Industry (
id VARCHAR(12) PRIMARY KEY,
title VARCHAR(100) NOT NULL,
description TEXT NULL,
level INT NOT NULL DEFAULT 0,
parentId VARCHAR(12) NULL,
createdAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
updatedAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),

CONSTRAINT fk_industry_parent
FOREIGN KEY (parentId)
REFERENCES Industry(id)
ON DELETE SET NULL
);
建表

为什么 Middleware 不能直接修改 request.headers？

- Middleware 和 API Route/Server Action 属于两套独立上下文：
  Middleware 使用的是 NextRequest 和 NextResponse 对象（基于 Edge Runtime）。
  API Route 和 Server Action 使用的是 Node.js 环境的 Request 对象。
  两者之间通过网络“桥接”，而非共享内存或对象：
  当 middleware 返回 NextResponse.next() 时，它只是告诉系统：“继续处理这个请求”。
  系统内部会把浏览器发过来的请求重新分发给 API Route 或 Server Action。
  这个分发过程不会自动带上 middleware 里修改过的 header，除非你明确通过：
  request.headers.set()（仅在 Middleware 内 fetch 请求有效）
  或通过 response.headers.set()（返回给客户端）

在这一点上，Next 框架和 Go 的 web 框架有巨大区别。Go 是可以在 middleware 里面解析 token 并增加 header 的。

icons 的参考位置https://mui.com/material-ui/material-icons/

部署过程

- 建立所有的表格，可以使用 npx prisma migrate deploy，也可以把 model 转换为 sql 语句执行建表的过程
- init 数据，以操作本地数据库为例，在启动服务之后，执行：

```
curl -c cookies.txt -X POST http://localhost:3000/api/matchlawyer/login \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@example.com", "password": "your_secure_password"}'
```

以及

```
curl -b cookies.txt -X POST http://localhost:3000/api/matchlawyer/menusettings/init
```

- 增加角色
- 设置角色到权限控制页面的各个节点上。

## 3. 自动化测试环境

### 环境概述

项目已建立完整的自动化测试环境，使用独立的测试数据库 `mockdb`，与开发环境完全隔离。

### 环境配置

#### 1. 创建测试数据库

确保 Docker MySQL 服务正在运行，然后创建测试数据库：

```bash
# 检查MySQL容器状态
docker ps | grep mysql

# 创建测试数据库
docker exec tests__-db-1 mysql -u root -pexample -e "CREATE DATABASE IF NOT EXISTS mockdb;"
```

#### 2. 创建测试环境配置文件

从开发环境配置复制并修改：

```bash
# 复制开发环境配置
cp .env.local .env.local.test

# 修改数据库连接为测试数据库
sed -i '' 's/library/mockdb/g' .env.local.test
```

测试环境配置文件 `.env.local.test` 内容：

```bash
# 测试环境配置
DATABASE_URL="mysql://root:example@localhost:3306/mockdb"
JWT_SECRET="e823fceb897788dde7dda7273a0f44037fe5e1f15cd28fac5b9683bbb021e4b8eb2767b56e273735286edb144bcdbfb0cfc81de2ac6a30c99a6626342430ceb1"
ADMIN_EMAIL="admin@test.com"
ADMIN_PASSWORD="abcd1234"
CLOUD_ENV_ID="test-cloud-env-id"
```

### 测试命令

#### 首次设置（按顺序执行）

```bash
# 1. 在测试数据库中创建表结构
npm run test:setup

# 2. 验证测试环境
npm run test:verify

# 3. 运行所有测试
npm test
```

#### 日常测试命令

```bash
# 运行所有测试
npm test

# 监听模式运行测试（开发时推荐）
npm run test:watch

# 重置测试数据库（清空所有数据）
npm run test:reset

# 验证测试环境
npm run test:verify
```

### 环境隔离

- **开发环境**：使用 `library` 数据库
- **测试环境**：使用 `mockdb` 数据库
- 两个环境完全隔离，互不影响

### 测试覆盖范围

当前测试覆盖：

- 搜索工具函数 (`lib/searchUtils.js`)
- 管理员 API (`pages/api/admin/*`)
- 客户端 API (`pages/api/client/*`)
- 文件访问 API (`pages/api/files/*`)
- 管理员页面 (`pages/admin/*`)

### 测试环境验证

`npm run test:verify` 会检查：

- 数据库连接状态
- 表结构完整性
- 数据操作功能
- 外键约束
- 唯一约束

### 注意事项

1. **首次使用**：必须先运行 `npm run test:setup` 创建表结构
2. **环境变量**：测试使用 `.env.local.test` 配置文件
3. **数据隔离**：测试不会影响开发数据库
4. **依赖安装**：确保已安装 `dotenv-cli` 依赖
5. **Docker 服务**：确保 MySQL Docker 容器正在运行

### 故障排除

#### 常见问题

1. **数据库连接失败**

   ```bash
   # 检查Docker容器状态
   docker ps | grep mysql

   # 重启MySQL容器
   docker restart tests__-db-1
   ```

2. **表结构不存在**

   ```bash
   # 重新设置测试数据库
   npm run test:setup
   ```

3. **环境变量问题**

   ```bash
   # 检查配置文件
   cat .env.local.test

   # 重新创建配置文件
   cp .env.local .env.local.test
   sed -i '' 's/library/mockdb/g' .env.local.test
   ```

4. **依赖缺失**
   ```bash
   # 安装测试依赖
   npm install --save-dev dotenv-cli
   ```

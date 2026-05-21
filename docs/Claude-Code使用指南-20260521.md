
# Claude Code 使用指南 — 2026-05-21 会话记录

## 一、部署基础设施梳理

### 服务器信息
- **IP：** 47.107.109.42（阿里云 ECS）
- **系统：** Linux / Node.js 20.20.2
- **项目路径：** /opt/lawyer-case-management/
- **运行方式：** PM2（进程名 lawyer-case，执行 `npm start`）
- **端口：** 3000（无 Nginx，Next.js 直接服务）
- **数据库：** SQLite（sqlite.db），本地文件存储

### 本地项目信息
- **路径：** F:\ai\lawyer-case-management\
- **框架：** Next.js 16.2.6 + TypeScript + Tailwind CSS v4 + shadcn/ui
- **ORM：** Drizzle + Turso/libsql
- **GitHub：** https://github.com/XIAOXIN0903/caseManagers.git

---

## 二、Bug 修复

### Bug 1：诉讼费计算器固定显示 50 元

**文件：** `src/app/(authenticated)/calculator/page.tsx`（第 58-66 行）

**根因：**
- `total = b.fixed` 直接覆盖（应为累加 `+=`）
- `remaining = 0` 强制终止循环，跳过后续分档

**修复：**
```typescript
// 修复前
if (b.fixed) {
  total = b.fixed;
  remaining = 0;
} else { ... }

// 修复后
if (b.fixed) {
  total += b.fixed;
} else { ... }
remaining -= segmentAmount;  // 统一处理
```

### Bug 2：密码修改提示成功但不生效

**文件：** `src/app/api/change-password/route.ts`（第 52 行）

**根因：** `.env.local` 文件已更新，但 Node.js 进程中的 `process.env.ADMIN_PASSWORD` 仍是旧值。`createToken()` 登录验证时读取内存中的值。

**修复：** 写入文件后同步更新内存
```typescript
await writeFile(envPath, updated, "utf-8");
process.env.ADMIN_PASSWORD = newPassword;  // 新增
```

### 附带修复：Cookie secure 标志

**文件：** `src/lib/auth.ts`、`src/app/api/login/route.ts`

**内容：** 增加 `!process.env.FORCE_INSECURE` 判断，使 HTTP 环境 Cookie 正常工作。服务器 `.env.local` 中有 `FORCE_INSECURE=true`。

---

## 三、部署流程

```bash
# 1. 本地构建
npm run build

# 2. 打包（排除 node_modules / 数据库 / 环境文件 / dev 缓存）
tar -czf lawyer-deploy.tar.gz \
  --exclude='node_modules' --exclude='sqlite.db' \
  --exclude='.env.local' --exclude='.git' --exclude='.next/dev' \
  .next public package.json package-lock.json \
  next.config.ts tsconfig.json drizzle.config.ts \
  postcss.config.mjs components.json eslint.config.mjs src

# 3. 上传
scp lawyer-deploy.tar.gz root@47.107.109.42:/tmp/

# 4. 服务器解压 & 重启
cd /opt/lawyer-case-management
pm2 stop lawyer-case
tar -xzf /tmp/lawyer-deploy.tar.gz --overwrite
pm2 start lawyer-case
```

---

## 四、关于 Claude Code

### Claude Code 与 Claude 的区别

| | Claude（模型） | Claude Code（CLI 工具） |
|---|---|---|
| 本质 | AI 大语言模型 | 基于 Claude 模型的开发工具 |
| 类比 | 大脑 | 大脑 + 手 |
| 能力 | 理解、生成文本 | 读写文件、执行命令、Git、部署等 |
| 使用方式 | API / 网页聊天 | 终端命令，直接操作项目 |

### 当前使用的 API 通道

- **后端：** DeepSeek API（`api.deepseek.com/anthropic`）
- **模型：** `deepseek-v4-pro[1m]`
- **结论：** 非 Anthropic 官方账号，无法使用 Claude 桌面版

### 安装 Claude Code 桌面版的条件

- Anthropic 官方账号（不支持 +86 手机号）
- Pro/Max/Teams/Enterprise 订阅
- 稳定代理

### 隐私说明

当前使用 DeepSeek API，上传的文件内容会传输到 DeepSeek 服务器，建议对敏感法律文书做脱敏处理。

---

## 五、已推送到 GitHub

**仓库：** XIAOXIN0903/caseManagers
**Commit：** 858ebe4
**内容：** 诉讼费计算修复 + 密码修改修复 + Cookie 安全标志修复

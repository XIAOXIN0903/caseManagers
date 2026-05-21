# 律师案件管理系统

## 启动

```bash
cd F:\ai\lawyer-case-management
npm run dev          # 开发服务器
npm run build        # 编译
npm run seed         # 重置数据库 + 种子数据
```

默认密码：`admin123`（`.env.local`）

## 技术栈

- Next.js 16.2.6 (App Router, Turbopack)
- shadcn/ui v4 (base-ui, **不支持 asChild**)
- Drizzle ORM + Turso/libsql (本地 `sqlite.db`)
- jose (JWT) + Zod 4 + Sonner (Toast)
- xlsx + docxtemplater + pizzip

## 关键注意事项

1. **base-ui 组件** (SheetTrigger, DropdownMenuTrigger, Dialog) 不支持 `asChild` 属性
2. **Select onValueChange** 返回 `string | null`，需 `||` 兜底
3. **"use server"** 文件只能导出 async 函数，常量/类型放单独文件
4. **Zod 4** 的 `ZodError` 用 `.message` 而非 `.errors[0].message`
5. **middleware.ts** 在 Next.js 16 已 deprecated

## 进度

- ✅ Phase 1-8 完成
- ⬜ Phase 9: PWA + 移动端打磨 + 设置页

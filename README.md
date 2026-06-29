# IMES · 应急物资智能管理系统

> Intelligent Emergency Material System — 基于 dbm 技术架构（Hono + GraphQL + Pothos + Prisma + React）

武汉市应急物资保障中心数字化升级方案的全栈实现，覆盖 **一品一码 · 入库出库 · 拆零赋码 · 效期预警 · 智慧大屏 · 全链路追溯**。

## 技术架构

```
┌─────────────────────────────────────────────────────────┐
│  web · React 18 + Vite + Apollo + Tailwind              │
├─────────────────────────────────────────────────────────┤
│  api · Hono + GraphQL Yoga + Pothos + Prisma            │
├─────────────────────────────────────────────────────────┤
│  PostgreSQL 16                                          │
└─────────────────────────────────────────────────────────┘
```

## 核心模块

| 模块 | 说明 |
|------|------|
| 物资档案 | 大类管理、物资建档、一品一码 |
| 库区货位 | A/B/C/D 四区、货架二维码 |
| 入库管理 | 选单→效期→赋码→上架 |
| 出库管理 | 六状态流转、FIFO、拆零残余码 |
| 库存盘点 | 水位预警、批次分布 |
| 智能预警 | 效期红绿灯、低/高库存 |
| 扫码追溯 | 全生命周期流转记录 |
| 智慧大屏 | 一屏统览全局 |

## 快速开始

### 环境要求

- Node.js 20+
- pnpm 9+
- PostgreSQL 16

### 安装

```bash
cd imes
pnpm install

# 配置数据库
cp api/.env.example api/.env
# 编辑 DATABASE_URL

# 生成 Prisma Client
pnpm prisma:g

# 推送 schema 并填充演示数据
cd api && npx prisma db push && pnpm db:seed
```

### 启动

```bash
# 根目录同时启动 api + web
pnpm dev

# 或分别启动
pnpm dev:api   # http://localhost:3200/graphql
pnpm dev:web   # http://localhost:5174
```

### 演示账号

| 用户名 | 密码 | 角色 |
|--------|------|------|
| admin | 123456 | 系统管理员 |
| supervisor | 123456 | 仓储主管 |
| keeper | 123456 | 仓管员 |

## 数据模型

```
MaterialCategory ─┬─ Material ─┬─ MaterialBatch ─ StockItem
                  │            └─ InboundOrderLine
Supplier ─────────┘            └─ OutboundOrderLine

Warehouse ─ Shelf ─ StockItem
StockItem ─ StockMovement (追溯链)
Alert (效期/库存预警)
```

## 业务流程

### 入库
1. 创建入库单 → 提交审核 → 主管审批
2. 录入批次效期 → 系统自动赋码（一品一码）
3. 扫码上架绑定货位 → 库存生效

### 出库（含拆零）
1. 创建出库单 → 六状态审批流转
2. FIFO 智能拣货建议 → 扫码核对
3. 拆零确认 → 自动生成残余码 → 库存扣减

## License

Private — 武汉市应急物资保障中心

import bcrypt from 'bcryptjs'
import { builder } from '../builder.js'
import { signToken } from '../lib/auth.js'
import { writeSystemLog } from '../lib/system-log.js'
import { serializeUser, userInclude } from '../lib/rbac.js'

const LoginInput = builder.inputType('LoginInput', {
  fields: (t) => ({
    username: t.string({ required: true }),
    password: t.string({ required: true }),
  }),
})

builder.mutationField('login', (t) =>
  t.field({
    type: 'JSON',
    args: { input: t.arg({ type: LoginInput, required: true }) },
    resolve: async (_, { input }, ctx) => {
      const user = await ctx.prisma.user.findUnique({
        where: { username: input.username },
        include: userInclude,
      })
      if (!user?.active) throw new Error('用户名或密码错误')
      const ok = await bcrypt.compare(input.password, user.password)
      if (!ok) throw new Error('用户名或密码错误')
      const token = signToken({ sub: user.id, username: user.username, role: user.role.code })
      await writeSystemLog(ctx, {
        userId: user.id,
        action: 'LOGIN',
        module: 'AUTH',
        summary: `${user.name ?? user.username} 登录系统`,
        targetId: user.id,
        targetLabel: user.username,
      })
      return {
        token,
        user: serializeUser(user),
      }
    },
  }),
)

builder.queryField('me', (t) =>
  t.field({
    type: 'JSON',
    nullable: true,
    authScopes: { authenticated: true },
    resolve: async (_, __, ctx) => ctx.identity,
  }),
)

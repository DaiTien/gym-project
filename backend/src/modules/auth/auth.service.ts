import bcrypt from 'bcryptjs'
import prisma from '../../lib/prisma'

export async function registerUser(email: string, name: string, password: string) {
  const existing = await prisma.user.findUnique({ where: { email } })
  if (existing) throw new Error('Email đã được sử dụng')

  const passwordHash = await bcrypt.hash(password, 10)
  const user = await prisma.user.create({
    data: { email, name, passwordHash },
    select: { id: true, email: true, name: true },
  })
  return user
}

export async function loginUser(email: string, password: string) {
  const user = await prisma.user.findUnique({ where: { email } })
  if (!user) throw new Error('Email hoặc mật khẩu không đúng')

  const valid = await bcrypt.compare(password, user.passwordHash)
  if (!valid) throw new Error('Email hoặc mật khẩu không đúng')

  return { id: user.id, email: user.email, name: user.name }
}

export async function getUserById(id: string) {
  return prisma.user.findUnique({
    where: { id },
    select: { id: true, email: true, name: true, weightKg: true, goalWeightKg: true },
  })
}

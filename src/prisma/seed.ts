import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

export async function seedSuperAdmin() {
  const existing = await prisma.user.findFirst({
    where: { role: 'super_admin' },
  });

  if (existing) {
    console.log('Super admin allaqachon mavjud');
    return;
  }

  const password = await bcrypt.hash('superadmin123', 10);

  await prisma.user.create({
    data: {
      fullName: 'Super Admin',
      email: 'superadmin@gmail.com',
      password,
      role: 'super_admin',
    },
  });

  console.log('✅ Super admin yaratildi');
}

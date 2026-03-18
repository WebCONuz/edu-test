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

  const email = process.env.SUPER_ADMIN_EMAIL!;
  const fullName = process.env.SUPER_ADMIN_FULL_NAME!;
  const password = await bcrypt.hash(process.env.SUPER_ADMIN_PASSWORD!, 10);

  await prisma.user.create({
    data: {
      fullName,
      email,
      password,
      role: 'super_admin',
    },
  });

  console.log('✅ Super admin yaratildi');
}

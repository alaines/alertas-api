// scripts/seed-admin.ts
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Hash de la contraseña
  const hashedPassword = await bcrypt.hash('admin123', 10);

  // Crear o actualizar usuario admin
  const admin = await prisma.user.upsert({
    where: { email: 'admin@alertas.com' },
    update: {},
    create: {
      email: 'admin@alertas.com',
      username: 'admin',
      password: hashedPassword,
      fullName: 'Administrador del Sistema',
      role: 'ADMIN',
      isActive: true,
    },
  });

  console.log('✅ Usuario admin creado/actualizado:');
  console.log('   Email: admin@alertas.com');
  console.log('   Password: admin123');
  console.log('   Role: ADMIN');
  console.log('   ID:', admin.id);
  console.log('\n⚠️  Por seguridad, cambia la contraseña después del primer login!');
}

main()
  .catch((e) => {
    console.error('❌ Error al hacer seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

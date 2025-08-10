import { PrismaClient, Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // ===== Seed Clients =====
  const clients = [
    {
      name: 'National Forestry Agency',
      description: 'Government agency overseeing forestry projects.',
      address: '123 Green Street, Kigali',
      phone: '+250788123456',
      email: 'contact@nfa.gov.rw',
      website: 'https://nfa.gov.rw',
    },
    {
      name: 'EcoWood Ltd',
      description: 'Private company specializing in sustainable wood products.',
      address: '45 Industrial Zone, Huye',
      phone: '+250788654321',
      email: 'info@ecowood.com',
      website: 'https://ecowood.com',
    },
    {
      name: 'GreenFuture NGO',
      description: 'Non-profit promoting environmental conservation.',
      address: '89 Conservation Ave, Musanze',
      phone: '+250788999888',
      email: 'hello@greenfuture.org',
      website: 'https://greenfuture.org',
    },
  ];

  for (const client of clients) {
    await prisma.client.upsert({
      where: { email: client.email },
      update: client,
      create: client,
    });
  }

  // ===== Seed Users (Members) =====
  const passwordHash = await bcrypt.hash('Admin@2347', 10);

  const users = [
    {
      email: 'hesel_adv@admin.com',
      firstName: 'Hesel administrator',
      lastName: '',
      role: Role.ADMIN,
      password: passwordHash,
    },
    // {
    //   email: 'manager@example.com',
    //   firstName: 'Manager',
    //   lastName: 'User',
    //   role: Role.USER,
    //   password: passwordHash,
    // },
    // {
    //   email: 'user@example.com',
    //   firstName: 'Regular',
    //   lastName: 'User',
    //   role: Role.USER,
    //   password: passwordHash,
    // },
  ];

  for (const user of users) {
    await prisma.user.upsert({
      where: { email: user.email },
      update: {},
      create: user,
    });
  }

  console.log('✅ Clients and Users seeded successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

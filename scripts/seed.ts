/**
 * Seed default plan configurations and a demo admin user.
 * Run with: bun run scripts/seed.ts
 */
import { db } from '../src/lib/db';
import bcrypt from 'bcryptjs';

async function main() {
  console.log('🌱 Seeding database...');

  // Default plan configs
  const plans = [
    {
      plan: 'free',
      name: 'Free',
      priceMonthly: 0,
      priceYearly: 0,
      maxProjects: 1,
      maxBranchesPerProject: 2,
      maxStorageMb: 100,
      maxConnections: 5,
      maxApiKeys: 2,
      maxQueryRows: 1000,
    },
    {
      plan: 'pro',
      name: 'Pro',
      priceMonthly: 29.90,
      priceYearly: 299.00,
      maxProjects: 10,
      maxBranchesPerProject: 10,
      maxStorageMb: 1024,
      maxConnections: 20,
      maxApiKeys: 10,
      maxQueryRows: 10000,
    },
    {
      plan: 'enterprise',
      name: 'Enterprise',
      priceMonthly: 199.90,
      priceYearly: 1999.00,
      maxProjects: 100,
      maxBranchesPerProject: 50,
      maxStorageMb: 10240,
      maxConnections: 100,
      maxApiKeys: 100,
      maxQueryRows: 100000,
    },
  ];

  for (const p of plans) {
    await db.planConfig.upsert({
      where: { plan: p.plan },
      update: p,
      create: p,
    });
    console.log(`  ✓ Plan: ${p.name} (R$ ${p.priceMonthly}/mês)`);
  }

  // Demo admin user
  const adminEmail = 'admin@neondb.dev';
  const adminPass = await bcrypt.hash('admin1234', 10);
  await db.user.upsert({
    where: { email: adminEmail },
    update: { role: 'admin', status: 'active', plan: 'enterprise' },
    create: {
      email: adminEmail,
      name: 'Administrador',
      passwordHash: adminPass,
      role: 'admin',
      plan: 'enterprise',
      status: 'active',
    },
  });
  console.log(`  ✓ Admin user: ${adminEmail} / admin1234`);

  // Demo regular user
  const userEmail = 'demo@neondb.dev';
  const userPass = await bcrypt.hash('demo1234', 10);
  await db.user.upsert({
    where: { email: userEmail },
    update: { role: 'user', status: 'active', plan: 'free' },
    create: {
      email: userEmail,
      name: 'Usuario Demo',
      passwordHash: userPass,
      role: 'user',
      plan: 'free',
      status: 'active',
    },
  });
  console.log(`  ✓ Demo user: ${userEmail} / demo1234`);

  // System settings
  const settings = [
    { key: 'platform_name', value: 'NeonDB' },
    { key: 'support_email', value: 'suporte@neondb.dev' },
    { key: 'currency', value: 'BRL' },
    { key: 'max_users', value: '500' },
    { key: 'maintenance_mode', value: 'false' },
    { key: 'signup_enabled', value: 'true' },
  ];
  for (const s of settings) {
    await db.systemSetting.upsert({
      where: { key: s.key },
      update: {},
      create: s,
    });
  }
  console.log(`  ✓ ${settings.length} system settings`);

  console.log('\n✅ Seed concluído!');
  console.log('\nLogins de teste:');
  console.log('  Admin:  admin@neondb.dev / admin1234');
  console.log('  User:   demo@neondb.dev / demo1234');
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => db.$disconnect());

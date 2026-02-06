#!/usr/bin/env tsx
/**
 * Seed script to create an admin user with default categories
 *
 * Usage:
 *   pnpm seed
 *   pnpm seed --email custom@email.com --name "Custom Name"
 */

// Load environment variables from .env.local
import { config } from 'dotenv';
import { resolve } from 'path';
config({ path: resolve(process.cwd(), '.env.local') });

import { seedAdmin } from '../lib/content/seed-admin';

async function main() {
  // Parse command line arguments
  const args = process.argv.slice(2);
  let email = 'admin@coparmex.com';
  let name = 'Admin Coparmex';

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--email' && args[i + 1]) {
      email = args[i + 1];
      i++;
    } else if (args[i] === '--name' && args[i + 1]) {
      name = args[i + 1];
      i++;
    }
  }

  console.log('🌱 Starting seed process...');
  console.log(`📧 Email: ${email}`);
  console.log(`👤 Name: ${name}`);
  console.log('');

  try {
    // Seed the admin
    console.log('🌱 Creating admin user with default categories...');
    const admin = await seedAdmin(email, name);

    console.log('');
    console.log(' Seed completed successfully!');
    console.log('');
    console.log('📊 Summary:');
    if (admin) {
      console.log(`   - Admin ID: ${admin.id}`);
      console.log(`   - Email: ${admin.email}`);
      console.log(`   - Name: ${admin.name}`);
      // console.log(`   - Categories: ${admin.contentEditorial?.categories?.length}`); // contentEditorial might be any
    }
    console.log('');
    console.log('🎉 You can now login with:');
    console.log(`   Email: ${email}`);
    console.log(`   OTP: 123456 (demo)`);
    console.log('');

    process.exit(0);
  } catch (error: any) {
    console.error('');
    console.error('Seed failed:');
    console.error(`   ${error.message}`);
    console.error('');

    if (error.message.includes('ECONNREFUSED')) {
      console.error('💡 Tip: Make sure MongoDB is running');
      console.error('   - Local: brew services start mongodb-community');
      console.error('   - Or check your MONGODB_URI in .env.local');
    }

    console.error('');
    process.exit(1);
  }
}

main();

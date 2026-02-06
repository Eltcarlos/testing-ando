import { PrismaClient } from '@prisma/client';
import { defaultCategories } from './seed-categories';

const prisma = new PrismaClient();

/**
 * Seed script to initialize an admin with default categories
 * Run this once to set up your first admin account
 */
export async function seedAdmin(email: string, name: string = 'Admin') {
  try {
    // Check if admin already exists
    const existingAdmin = await prisma.admins.findFirst({
      where: { email }
    });

    if (existingAdmin) {
      console.log(`Admin with email ${email} already exists`);
      return existingAdmin;
    }

    // Create categories with IDs
    const categoriesWithIds = defaultCategories.map(cat => ({
      ...cat,
      id: new Date().getTime().toString() + Math.random().toString(36).substr(2, 9),
      createdAt: new Date(),
    }));

    const contentEditorial = {
      categories: categoriesWithIds,
      blogPosts: null, // According to schema, this can be null
      settings: {
        defaultFormat: 'listicle',
        autoPublish: false,
        topicsPerSuggestion: 5,
      },
    };

    // Use Prisma's $runCommandRaw for direct MongoDB operations
    const result = await prisma.$runCommandRaw({
      insert: 'admins',
      documents: [{
        email,
        name,
        role: 'super_admin',
        contentEditorial,
        createdAt: new Date(),
        updatedAt: new Date(),
      }]
    });

    if (result.ok) {
      console.log(` Admin created successfully: ${email}`);
      console.log(` ${categoriesWithIds.length} categories seeded`);
      console.log(`📝 ${defaultCategories.reduce((acc, cat) => acc + cat.topics.length, 0)} topics total`);

      // Return the created admin
      return await prisma.admins.findFirst({
        where: { email }
      });
    } else {
      throw new Error('Failed to create admin');
    }
  } catch (error) {
    console.error('Error seeding admin:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

/**
 * Update an existing admin with default categories if they don't have them
 */
export async function updateAdminWithCategories(email: string) {
  try {
    const categoriesWithIds = defaultCategories.map(cat => ({
      ...cat,
      id: new Date().getTime().toString() + Math.random().toString(36).substr(2, 9),
      createdAt: new Date(),
    }));

    // Use Prisma's $runCommandRaw to update
    const result = await prisma.$runCommandRaw({
      update: 'admins',
      updates: [{
        q: { email },
        u: {
          $set: {
            'contentEditorial.categories': categoriesWithIds,
            'contentEditorial.blogPosts': null,
            'contentEditorial.settings': {
              defaultFormat: 'listicle',
              autoPublish: false,
              topicsPerSuggestion: 5,
            },
          },
        },
      }]
    });

    if (result.ok) {
      console.log(` Admin updated with categories: ${email}`);
      return true;
    } else {
      console.log(`No changes made to admin: ${email}`);
      return false;
    }
  } catch (error) {
    console.error('Error updating admin:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

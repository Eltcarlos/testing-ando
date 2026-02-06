import {
  PrismaClient,
  UserManagementEnum,
  UserManagementStatus,
} from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const email = process.env.SEED_ADMIN_EMAIL ?? "admin@local.test";
  const fullName = process.env.SEED_ADMIN_NAME ?? "Admin User";
  const phone = process.env.SEED_ADMIN_PHONE ?? null;
  const companyName = process.env.SEED_ADMIN_COMPANY ?? "Admin";

  console.log(`Seeding admin user: ${email}`);

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    console.log("Admin user already exists, skipping.");
    return;
  }

  await prisma.user.create({
    data: {
      fullName,
      email,
      phone,
      companyName,
      role: UserManagementEnum.admin,
      status: UserManagementStatus.active,
      god: true,
    },
  });

  console.log(`Created admin user: ${email}`);
}

main()
  .catch((e) => {
    console.error("Seed admin failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

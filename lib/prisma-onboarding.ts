import { PrismaClient } from ".prisma/client-onboarding";

const globalForPrismaOnboarding = globalThis as unknown as {
  prismaOnboarding: PrismaClient | undefined;
};

export const prismaOnboarding =
  globalForPrismaOnboarding.prismaOnboarding ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrismaOnboarding.prismaOnboarding = prismaOnboarding;
}

export default prismaOnboarding;

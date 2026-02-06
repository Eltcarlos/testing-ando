import { prisma } from "@/lib/prisma";

/**
 * Create a 6-digit verification token that expires in 5 minutes
 */
export async function createVerificationToken(identifier: string) {
    const token = Math.floor(100000 + Math.random() * 900000).toString();
    const expires = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

    const verificationToken = await prisma.verificationToken.create({
        data: {
            identifier,
            token,
            expires,
        },
    });

    return verificationToken;
}

export default createVerificationToken;

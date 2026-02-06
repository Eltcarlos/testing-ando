import { headers } from "next/headers";

/**
 * Gets the base URL dynamically from request headers.
 * Works correctly in any deployment environment (local, Amplify, custom domain).
 * 
 * Priority:
 * 1. x-forwarded-host header (for proxied requests)
 * 2. host header
 * 3. Environment variable fallback
 * 4. localhost fallback
 */
export async function getBaseUrl(): Promise<string> {
  const headersList = await headers();
  
  // Check for forwarded host first (common in serverless/proxy setups)
  const forwardedHost = headersList.get("x-forwarded-host");
  const host = headersList.get("host");
  
  const hostname = forwardedHost || host;
  
  if (hostname) {
    // Determine protocol - assume https in production
    const forwardedProto = headersList.get("x-forwarded-proto");
    const protocol = forwardedProto || (hostname.includes("localhost") ? "http" : "https");
    return `${protocol}://${hostname}`;
  }
  
  // Fallback to environment variable or localhost
  return process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL || "http://localhost:3000";
}

/**
 * Synchronous version for use in contexts where headers() is not available.
 * Falls back to environment variables only.
 */
export function getBaseUrlSync(): string {
  return process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL || "http://localhost:3000";
}

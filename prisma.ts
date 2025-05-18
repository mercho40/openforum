// import { PrismaClient } from '@prisma/client';
// import { neonConfig } from '@neondatabase/serverless';
import { PrismaClient } from "@/generated/prisma";
import { PrismaNeon } from '@prisma/adapter-neon';
const connectionString = `${process.env.DATABASE_URL}`;

// import ws from 'ws';
// neonConfig.webSocketConstructor = ws;

// To work in edge environments (Cloudflare Workers, Vercel Edge, etc.), enable querying over fetch
// neonConfig.poolQueryViaFetch = true

// Type definitions
// declare global {
//   var prisma: PrismaClient | undefined
// }
const globalForPrisma = global as unknown as { prisma: PrismaClient };
const adapter = new PrismaNeon({ connectionString });
export const prisma = globalForPrisma.prisma || new PrismaClient({ adapter });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;


// const adapter = new PrismaNeon({ connectionString });
// export const prisma = new PrismaClient({ adapter });


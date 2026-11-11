import {PrismaClient} from '@prisma/client';
import {PrismaPg} from '@prisma/adapter-pg';
const globalDB=globalThis as unknown as {preparationDB?:PrismaClient};
export const db=globalDB.preparationDB??new PrismaClient({adapter:new PrismaPg({connectionString:process.env.DATABASE_URL})});
if(process.env.NODE_ENV!=='production')globalDB.preparationDB=db;

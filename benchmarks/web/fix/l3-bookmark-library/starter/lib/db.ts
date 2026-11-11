import {PrismaClient} from '@prisma/client';
import {PrismaPg} from '@prisma/adapter-pg';
const connectionString=process.env.DATABASE_URL!;
export const db=new PrismaClient({adapter:new PrismaPg({connectionString},{schema:new URL(connectionString).searchParams.get('schema')||'public'})});

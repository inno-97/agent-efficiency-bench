import 'dotenv/config';
import {test,expect,afterAll} from 'vitest';
import {z} from 'zod';
import {db} from './lib/db';
afterAll(async()=>{await db.$disconnect();});
test('PostgreSQL/Prisma transaction roundtrip',async()=>{let id:string|undefined;try{const row=await db.preparationProbe.create({data:{message:'preparation-smoke'}});id=row.id;expect((await db.preparationProbe.findUniqueOrThrow({where:{id}})).message).toBe('preparation-smoke');}finally{if(id)await db.preparationProbe.delete({where:{id}});}});
test('Zod validation',()=>{expect(z.object({name:z.string().trim().min(1)}).safeParse({name:' '}).success).toBe(false);});

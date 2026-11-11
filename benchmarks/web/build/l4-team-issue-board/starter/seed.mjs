import 'dotenv/config';
import {PrismaClient} from '@prisma/client';
import {PrismaPg} from '@prisma/adapter-pg';
import {scryptSync} from 'node:crypto';
const db=new PrismaClient({adapter:new PrismaPg({connectionString:process.env.DATABASE_URL},{schema:new URL(process.env.DATABASE_URL).searchParams.get('schema')||'public'})});
try{await db.$transaction([db.comment.deleteMany(),db.issue.deleteMany(),db.member.deleteMany(),db.project.deleteMany(),db.bookmark.deleteMany(),db.session.deleteMany(),db.user.deleteMany()]);
for(const id of ['alice','bob','carol'])await db.user.create({data:{id,email:id+'@example.test',password:'benchmark-seed:'+scryptSync('benchmark-password','benchmark-seed',32).toString('hex')}});
await db.project.createMany({data:[{id:'p1',title:'Alpha',ownerId:'alice'},{id:'p2',title:'Private',ownerId:'carol'}]});
await db.member.create({data:{projectId:'p1',userId:'bob'}});
console.log('Seeded disposable benchmark accounts.');}finally{await db.$disconnect()}

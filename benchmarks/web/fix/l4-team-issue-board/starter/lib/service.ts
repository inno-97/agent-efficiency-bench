import {db} from './db';
import {randomBytes,scryptSync,timingSafeEqual,createHash} from 'node:crypto';
import {z} from 'zod';
class Failure extends Error {constructor(public status:number,message:string){super(message)}}
const fail=(status:number,message:string):never=>{throw new Failure(status,message)};
const title=z.string().trim().min(1).max(120);
const bookmark=z.object({title,url:z.string().url().refine(v=>/^https?:\/\//i.test(v)),tags:z.array(z.string().trim().min(1).max(30)).max(5).default([])});
const issue=z.object({title,body:z.string().trim().max(2000),status:z.enum(['open','done']).default('open')});
const json=(body:any,status=200,headers:Record<string,string>={})=>Response.json(body,{status,headers});
const hash=(token:string)=>createHash('sha256').update(token).digest('hex');
export function passwordHash(value:string,salt=randomBytes(16).toString('hex')){return salt+':'+scryptSync(value,salt,32).toString('hex')}
export async function handle(req:Request){try{
 const url=new URL(req.url),p=url.pathname.split('/').filter(Boolean).slice(1),method=req.method;
 if(method!=='GET'&&req.headers.has('origin')&&req.headers.get('origin')!==url.protocol+'//'+req.headers.get('host'))fail(403,'origin');
 const body=async()=>{if(!req.headers.get('content-type')?.includes('application/json'))fail(415,'JSON required');return req.json().catch(()=>fail(400,'invalid JSON'))};
 if(p[0]==='health')return json({ok:true});
 if(p[0]==='login'&&method==='POST'){
  const data=z.object({email:z.string().email(),password:z.string().min(1).max(200)}).parse(await body());
  const user=await db.user.findUnique({where:{email:data.email}});
  if(!user)fail(401,'credentials');const [salt,digest]=user.password.split(':');
  if(!timingSafeEqual(Buffer.from(digest,'hex'),scryptSync(data.password,salt,32)))fail(401,'credentials');
  const token=randomBytes(32).toString('hex');await db.session.create({data:{token:hash(token),userId:user.id,expiresAt:new Date(Date.now()+3600000)}});
  return json({id:user.id},200,{'Set-Cookie':`session=${token}; HttpOnly; SameSite=Lax; Path=/; Max-Age=3600`});
 }
 const token=(req.headers.get('cookie')||'').split(';').map(v=>v.trim()).find(v=>v.startsWith('session='))?.slice(8);
 const session=token?await db.session.findUnique({where:{token:hash(token)}}):null;
 if(!session||session.expiresAt.getTime()<=Date.now())fail(401,'login required');const uid=session.userId;
 if(p[0]==='logout'&&method==='POST'){await db.session.delete({where:{token:session.token}});return json({ok:true},200,{'Set-Cookie':'session=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0'})}
 if(p[0]==='me'&&method==='GET')return json({id:uid});
 if(p[0]==='bookmarks'){
  if(!p[1]){
   if(method==='POST'){const data=bookmark.parse(await body());return json(await db.bookmark.create({data:{...data,tags:[...new Set(data.tags)],userId:uid}}),201)}
   if(method==='GET'){
    const page=z.coerce.number().int().min(1).max(10000).parse(url.searchParams.get('page')||1);
    const q=url.searchParams.get('q')||'',tag=url.searchParams.get('tag');
    const where={userId:uid,...(q?{title:{contains:q,mode:'insensitive' as const}}:{}),...(tag?{tags:{has:tag}}:{})};
    const items=await db.bookmark.findMany({where,orderBy:[{createdAt:'asc'},{id:'asc'}],skip:(page-1)*5,take:5});return json({items,total:await db.bookmark.count({where}),page});
   }
  }
  const item=await db.bookmark.findUnique({where:{id:p[1]}});
  if(!item||item.userId!==uid)fail(404,'bookmark'); // OWNER_GUARD
  if(method==='GET')return json(item);
  if(method==='PATCH'){const data=bookmark.parse(await body());return json(await db.bookmark.update({where:{id:item.id},data:{...data,tags:[...new Set(data.tags)]}}))}
  if(method==='DELETE'){await db.bookmark.delete({where:{id:item.id}});return json({ok:true})}
 }
 const projectAccess=async(id:string)=>{
  const project=await db.project.findUnique({where:{id}});const member=await db.member.findUnique({where:{projectId_userId:{projectId:id,userId:uid}}});
  if(!project)fail(404,'project'); // TODO: diagnose access regression
  return project;
 };
 if(p[0]==='projects'){
  if(!p[1]&&method==='GET'){
   const memberships=await db.member.findMany({where:{userId:uid}});
   return json(await db.project.findMany({where:{OR:[{ownerId:uid},{id:{in:memberships.map(m=>m.projectId)}}]},orderBy:{id:'asc'}}));
  }
  const project=await projectAccess(p[1]);
  if(p[2]==='members'){
   if(method==='GET')return json(await db.member.findMany({where:{projectId:project.id}}));
   if(project.ownerId!==uid)fail(403,'owner required');
   if(method==='POST'){const d=z.object({userId:z.string().min(1)}).parse(await body());if(!await db.user.findUnique({where:{id:d.userId}}))fail(400,'user');return json(await db.member.upsert({where:{projectId_userId:{projectId:project.id,userId:d.userId}},create:{projectId:project.id,userId:d.userId},update:{}}),201)}
   if(method==='DELETE'){if(p[3]===project.ownerId)fail(400,'cannot remove owner');await db.member.deleteMany({where:{projectId:project.id,userId:p[3]}});return json({ok:true})}
  }
  if(p[2]==='issues'){
   if(!p[3]){
    if(method==='GET')return json(await db.issue.findMany({where:{projectId:project.id},orderBy:[{createdAt:'asc'},{id:'asc'}]}));
    if(method==='POST'){const data=issue.parse(await body());return json(await db.issue.create({data:{...data,projectId:project.id,authorId:uid}}),201)}
   }
   const item=await db.issue.findUnique({where:{id:p[3]}});if(!item||item.projectId!==project.id)fail(404,'issue');
   if(p[4]==='comments'){
    if(method==='GET')return json(await db.comment.findMany({where:{issueId:item.id},orderBy:[{createdAt:'asc'},{id:'asc'}]}));
    if(method==='POST'){const d=z.object({body:z.string().trim().min(1).max(1000)}).parse(await body());return json(await db.comment.create({data:{...d,issueId:item.id,authorId:uid}}),201)}
    if(method==='DELETE'){const comment=await db.comment.findUnique({where:{id:p[5]}});if(!comment||comment.issueId!==item.id)fail(404,'comment');if(comment.authorId!==uid&&project.ownerId!==uid)fail(403,'author required');await db.comment.delete({where:{id:comment.id}});return json({ok:true})}
   }
   if(method==='GET')return json(item);
   // TODO: diagnose issue update regression
   if(method==='PATCH')return json(await db.issue.update({where:{id:item.id},data:issue.parse(await body())}));
   if(method==='DELETE'){await db.$transaction([db.comment.deleteMany({where:{issueId:item.id}}),db.issue.delete({where:{id:item.id}})]);return json({ok:true})}
  }
 }
 fail(404,'route');
 }catch(e){if(e instanceof z.ZodError)return json({error:'validation'},400);if(e instanceof Failure)return json({error:e.message},e.status);console.error(e);return json({error:'internal'},500)}}

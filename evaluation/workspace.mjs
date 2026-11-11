import assert from 'node:assert/strict';
import {cp,mkdtemp,readFile,writeFile,rm} from 'node:fs/promises';
import {resolve,join,basename} from 'node:path';
import {tmpdir} from 'node:os';
import {spawn} from 'node:child_process';
import {createRequire} from 'node:module';
import {randomBytes} from 'node:crypto';
import {createServer} from 'node:net';
import {fileURLToPath} from 'node:url';
const repo=fileURLToPath(new URL('../',import.meta.url));
const require=createRequire(join(repo,'preparation/web/package.json'));
const wait=ms=>new Promise(r=>setTimeout(r,ms));
async function command(bin,args,cwd,env){return new Promise((yes,no)=>{const p=spawn(bin,args,{cwd,env,stdio:['ignore','pipe','pipe']});let log='';p.stdout.on('data',x=>log=(log+x).slice(-8000));p.stderr.on('data',x=>log=(log+x).slice(-8000));const timer=setTimeout(()=>p.kill('SIGKILL'),600000);p.once('error',no);p.once('close',code=>{clearTimeout(timer);code===0?yes(log):no(Error('Build/setup command failed: '+bin+' '+args.join(' ')+'\n'+log.replace(/postgresql:\/\/[^\s"']+/g,'[DATABASE_URL]')))});});}
export async function isolatedApp(candidate,options={}){
  const {Pool}=require('pg');
 const root=resolve(candidate),meta=JSON.parse(await readFile(join(root,'task.json'),'utf8'));
 if(!['bookmarks','issues','sync-server'].includes(meta.suite))throw Error('Unsupported workspace suite');
 const raw=await readFile(join(repo,'preparation/web/.env'),'utf8');const configured=process.env.BENCH_DATABASE_URL||raw.match(/^DATABASE_URL=["']?([^"'\n]+)/m)?.[1];
 if(!configured)throw Error('Run npm run env:init; evaluator requires a disposable PostgreSQL database');
 const schema='bench_'+randomBytes(10).toString('hex');const url=new URL(configured);url.searchParams.set('schema',schema);
 const pool=new Pool({connectionString:configured});const dir=await mkdtemp(join(tmpdir(),'agent-bench-web-'));
 let server,output='';
 const stop=async()=>{if(server&&server.exitCode===null&&server.signalCode===null&&server.signalCode===null){server.kill('SIGTERM');await Promise.race([new Promise(r=>server.once('exit',r)),wait(5000)]);if(server.exitCode===null&&server.signalCode===null){server.kill('SIGKILL');await new Promise(r=>server.once('exit',r))}}};
 const cleanup=async()=>{await stop();await pool.query('DROP SCHEMA IF EXISTS "'+schema+'" CASCADE');await pool.end();await rm(dir,{recursive:true,force:true})};
 try{
 await pool.query('CREATE SCHEMA "'+schema+'"');
 await cp(root,dir,{recursive:true,filter:p=>p===root||!['node_modules','.next','.git','.env','androidTest','test'].includes(basename(p))});
 const env={...process.env,DATABASE_URL:url.toString(),NEXT_TELEMETRY_DISABLED:'1'};
 await command('npm',['ci','--no-audit','--no-fund'],dir,env);
 for(const args of [['run','db:generate'],['run','db:push'],['run','db:seed'],['run','build']])await command('npm',args,dir,env);
 const port=await new Promise((yes,no)=>{const s=createServer();s.once('error',no);s.listen(options.port||0,'127.0.0.1',()=>{const port=s.address().port;s.close(()=>yes(port))})});
 const base='http://127.0.0.1:'+port;
 const start=async()=>{server=spawn(process.execPath,[join(dir,'node_modules/next/dist/bin/next'),'start','-H','127.0.0.1','-p',String(port)],{cwd:dir,env,stdio:['ignore','pipe','pipe']});server.stdout.on('data',d=>output=(output+d).slice(-4000));server.stderr.on('data',d=>output=(output+d).slice(-4000));for(let i=0;i<150;i++){if(server.exitCode!==null)throw Error('Server exited: '+output);try{await fetch(base+'/api/health',{signal:AbortSignal.timeout(3000)});return}catch{}await wait(200)}throw Error('Server startup timeout')};
 await start();return {base,meta,schema,pool,dir,restart:async()=>{await stop();await start()},close:cleanup};
 }catch(e){await cleanup();throw e}
}
export async function evaluateWorkspace(candidate){
 const app=await isolatedApp(candidate),results=[];
 const test=async(name,fn)=>{try{await fn();results.push({name,passed:true})}catch(e){results.push({name,passed:false,error:e.message})}};
 const request=async(path,method='GET',data, cookie='',headers={})=>{const r=await fetch(app.base+'/api/'+path,{method,signal:AbortSignal.timeout(15000),headers:{...(cookie?{cookie}:{}),'Content-Type':'application/json',...headers},...(data!==undefined?{body:JSON.stringify(data)}:{})});return {status:r.status,data:await r.json(),cookie:r.headers.get('set-cookie')}};
 const expect=async(code,...args)=>{const r=await request(...args);assert.equal(r.status,code,JSON.stringify(r.data));return r};
 const login=async(user)=>{const r=await request('login','POST',{email:user+'@example.test',password:'benchmark-password'});return r.cookie?.split(';')[0]||''};
 let a='',b='',c='';
 try{
 await test('auth/invalid-password',()=>expect(401,'login','POST',{email:'alice@example.test',password:'wrong'}));
 await test('auth/unauthenticated',()=>expect(401,app.meta.suite==='bookmarks'?'bookmarks':'projects'));
 await test('auth/session-cookie',async()=>{const r=await expect(200,'login','POST',{email:'alice@example.test',password:'benchmark-password'});assert.match(r.cookie,/HttpOnly/i);assert.match(r.cookie,/SameSite=Lax/i);a=r.cookie.split(';')[0];assert.match(a,/session=[0-9a-f]{64}/);assert.equal((await expect(200,'me','GET',undefined,a)).data.id,'alice')});
 b=await login('bob');c=await login('carol');
 await test('auth/forged-cookie',()=>expect(401,'me','GET',undefined,'session=alice'));
 await test('auth/cross-origin',()=>expect(403,'logout','POST',{},a,{Origin:'https://foreign.invalid'}));
 if(app.meta.suite==='bookmarks'){
 let id='';
 await test('bookmark/create-server-owner',async()=>{const r=await expect(201,'bookmarks','POST',{title:'  Alpha  ',url:'https://example.test/a',tags:['web','web'],userId:'bob'},a);id=r.data.id;assert.equal(r.data.userId,'alice');assert.equal(r.data.title,'Alpha');assert.deepEqual(r.data.tags,['web'])});
 await test('bookmark/validation',async()=>{for(const data of [{title:' ',url:'https://example.test'},{title:'x'.repeat(121),url:'https://example.test'},{title:'x',url:'javascript:alert(1)'},{title:'x',url:'https://example.test',tags:['']},{title:'x',url:'https://example.test',tags:Array(6).fill('a')}])await expect(400,'bookmarks','POST',data,a)});
 await test('bookmark/isolation-list',async()=>{const r=await expect(200,'bookmarks','GET',undefined,b);assert.equal(r.data.total,0)});
 await test('bookmark/isolation-direct',async()=>{await expect(404,'bookmarks/'+id,'GET',undefined,b)});
 await test('bookmark/isolation-edit',async()=>{await expect(404,'bookmarks/'+id,'PATCH',{title:'stolen',url:'https://evil.test',tags:[]},b);assert.equal((await expect(200,'bookmarks/'+id,'GET',undefined,a)).data.title,'Alpha')});
 await test('bookmark/isolation-delete',async()=>{await expect(404,'bookmarks/'+id,'DELETE',undefined,b)});
 await test('bookmark/edit',async()=>{await request('bookmarks/'+id,'DELETE',undefined,a);id=(await expect(201,'bookmarks','POST',{title:'Fresh edit',url:'https://example.test',tags:[]},a)).data.id;const r=await expect(200,'bookmarks/'+id,'PATCH',{title:'Updated',url:'https://example.test/b',tags:['test']},a);assert.equal(r.data.id,id);assert.equal(r.data.title,'Updated')});
 await test('bookmark/search-tag-pagination',async()=>{for(let i=0;i<7;i++)await expect(201,'bookmarks','POST',{title:'Search '+i,url:'https://example.test/'+i,tags:[i%2?'odd':'even']},a);const all=(await expect(200,'bookmarks','GET',undefined,a)).data;assert.equal(all.total,8);assert.equal(all.items.length,5);const next=(await expect(200,'bookmarks?page=2','GET',undefined,a)).data;assert.equal(next.items.length,3);assert.equal(new Set([...all.items,...next.items].map(i=>i.id)).size,8);const filtered=(await expect(200,'bookmarks?q=SEARCH&tag=even','GET',undefined,a)).data;assert.equal(filtered.total,4);for(const page of ['0','-1','1.5','bad'])await expect(400,'bookmarks?page='+page,'GET',undefined,a)});
 await test('bookmark/restart-persistence',async()=>{await app.restart();assert.equal((await expect(200,'bookmarks/'+id,'GET',undefined,a)).data.title,'Updated')});
 await test('bookmark/delete',async()=>{await expect(200,'bookmarks/'+id,'DELETE',undefined,a);await expect(404,'bookmarks/'+id,'GET',undefined,a)});
 }else{
 let id='',comment='',foreign='';
 await test('project/list-isolation',async()=>{assert.deepEqual((await expect(200,'projects','GET',undefined,b)).data.map(p=>p.id),['p1']);assert.deepEqual((await expect(200,'projects','GET',undefined,c)).data.map(p=>p.id),['p2'])});
 await test('project/direct-isolation',()=>expect(404,'projects/p1/issues','GET',undefined,c));
 await test('issue/create-author',async()=>{const r=await expect(201,'projects/p1/issues','POST',{title:'  Work  ',body:'detail',authorId:'alice',projectId:'p2'},b);id=r.data.id;assert.equal(r.data.authorId,'bob');assert.equal(r.data.projectId,'p1');assert.equal(r.data.title,'Work');const f=await expect(201,'projects/p2/issues','POST',{title:'private',body:''},c);foreign=f.data.id});
 await test('issue/validation',async()=>{for(const data of [{title:' ',body:''},{title:'x',body:'',status:'bad'},{title:'x',body:'x'.repeat(2001)}])await expect(400,'projects/p1/issues','POST',data,a)});
 await test('issue/cross-project-id',()=>expect(404,'projects/p1/issues/'+foreign,'GET',undefined,a));
 await test('issue/member-read',async()=>{assert.equal((await expect(200,'projects/p1/issues/'+id,'GET',undefined,a)).data.id,id)});
 await test('member/owner-only',()=>expect(403,'projects/p1/members','POST',{userId:'carol'},b));
 await test('issue/author-owner-edit',async()=>{await expect(200,'projects/p1/issues/'+id,'PATCH',{title:'Owner edit',body:'',status:'done'},a);await expect(201,'projects/p1/members','POST',{userId:'carol'},a);await expect(403,'projects/p1/issues/'+id,'PATCH',{title:'stolen',body:''},c);await expect(403,'projects/p1/issues/'+id,'DELETE',undefined,c)});
 await test('comment/author-and-relations',async()=>{const r=await expect(201,'projects/p1/issues/'+id+'/comments','POST',{body:' hello ',authorId:'alice'},b);comment=r.data.id;assert.equal(r.data.authorId,'bob');await expect(403,'projects/p1/issues/'+id+'/comments/'+comment,'DELETE',undefined,c);await expect(400,'projects/p1/issues/'+id+'/comments','POST',{body:' '},a);await expect(404,'projects/p1/issues/'+foreign+'/comments/'+comment,'DELETE',undefined,a)});
 await test('member/removal-revokes-existing-session',async()=>{await expect(200,'projects/p1/members/bob','DELETE',undefined,a);for(const path of ['projects/p1/issues','projects/p1/issues/'+id,'projects/p1/issues/'+id+'/comments'])await expect(404,path,'GET',undefined,b);await expect(404,'projects/p1/issues','POST',{title:'denied',body:''},b);await expect(201,'projects/p1/members','POST',{userId:'bob'},a);await expect(200,'projects/p1/issues/'+id,'GET',undefined,b)});
 await test('member/cannot-remove-owner',()=>expect(400,'projects/p1/members/alice','DELETE',undefined,a));
 await test('issue/restart-persistence',async()=>{const saved=(await expect(201,'projects/p1/issues','POST',{title:'Restart',body:'persistent',status:'done'},b)).data;await app.restart();assert.equal((await expect(200,'projects/p1/issues/'+saved.id,'GET',undefined,b)).data.status,'done')});
 await test('issue/delete-cascades-comments',async()=>{await expect(200,'projects/p1/issues/'+id,'DELETE',undefined,b);await expect(404,'projects/p1/issues/'+id+'/comments','GET',undefined,a);assert.equal(Number((await app.pool.query('SELECT count(*) AS n FROM "'+app.schema+'"."Comment" WHERE "issueId"=$1',[id])).rows[0].n),0)});
 }
 const {chromium}=await import('playwright');const browser=await chromium.launch({headless:true});
 try{
 await test('ui/create-edit-reload-delete',async()=>{const page=await browser.newPage();page.setDefaultTimeout(6000);try{await page.goto(app.base);if(app.meta.suite==='bookmarks')await page.getByLabel('Email',{exact:true}).fill('carol@example.test');await page.getByRole('button',{name:'Login',exact:true}).click();await page.getByRole('button',{name:'Logout',exact:true}).waitFor();const text='UI '+randomBytes(4).toString('hex');await page.getByLabel('Title',{exact:true}).fill(text);await page.getByRole('button',{name:'Create',exact:true}).click();await page.getByRole('button',{name:text,exact:true}).click();await page.getByLabel('Title',{exact:true}).fill(text+' edited');await page.getByRole('button',{name:'Save',exact:true}).click();await page.getByRole('button',{name:text+' edited',exact:true}).waitFor();await page.reload();await page.getByRole('button',{name:text+' edited',exact:true}).waitFor();await page.getByRole('button',{name:'Delete '+text+' edited',exact:true}).click();await page.getByRole('button',{name:text+' edited',exact:true}).waitFor({state:'detached'});await page.getByRole('button',{name:'Logout',exact:true}).click();await page.getByRole('button',{name:'Login',exact:true}).waitFor()}finally{await page.close()}});
 await test('ui/validation-and-safe-text',async()=>{const page=await browser.newPage();page.setDefaultTimeout(6000);try{await page.goto(app.base);if(app.meta.suite==='bookmarks')await page.getByLabel('Email',{exact:true}).fill('bob@example.test');await page.getByRole('button',{name:'Login',exact:true}).click();await page.getByRole('button',{name:'Logout',exact:true}).waitFor();await page.getByRole('button',{name:'Create',exact:true}).click();await page.waitForFunction(()=>document.querySelector('[role=alert]')?.textContent?.includes('validation'));const text='<img src=x onerror="window.pwned=1">';await page.getByLabel('Title',{exact:true}).fill(text);await page.getByRole('button',{name:'Create',exact:true}).click();await page.getByRole('button',{name:text,exact:true}).waitFor();assert.equal(await page.locator('main img').count(),0);assert.equal(await page.evaluate(()=>window.pwned),undefined)}finally{await page.close()}});
 }finally{await browser.close()}
 await test('auth/logout-revokes',async()=>{await expect(200,'logout','POST',{},a);await expect(401,'me','GET',undefined,a)});
 await test('auth/expired-session',async()=>{const cookie=await login('alice');await app.pool.query(`UPDATE "${app.schema}"."Session" SET "expiresAt"=NOW()-INTERVAL '2 hours'`);await expect(401,'me','GET',undefined,cookie)});
 return {task:app.meta.id,version:app.meta.version,candidate:resolve(candidate),total:results.length,passed:results.filter(r=>r.passed).length,results};
 }finally{await app.close()}
}

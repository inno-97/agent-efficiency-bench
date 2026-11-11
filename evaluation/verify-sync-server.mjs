import {isolatedApp} from './workspace.mjs';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
const app=await isolatedApp('evaluation/sync-server');
try{
 const call=async(path,method='GET',data,cookie='')=>{const r=await fetch(app.base+'/api/'+path,{method,headers:{'content-type':'application/json',cookie},...(data?{body:JSON.stringify(data)}:{})});return {status:r.status,data:await r.json(),cookie:r.headers.get('set-cookie')?.split(';')[0]}};
 const a=(await call('login','POST',{email:'alice@example.test',password:'benchmark-password'})).cookie,b=(await call('login','POST',{email:'bob@example.test',password:'benchmark-password'})).cookie;
 assert.equal((await call('items')).status,401);
 const data={operationId:randomUUID(),id:randomUUID(),baseVersion:0,title:'First',completed:false,deleted:false};
 const first=await call('sync','POST',data,a);assert.equal(first.status,200);assert.equal(first.data.item.version,1);
 const repeat=await call('sync','POST',data,a);assert.deepEqual(repeat,first);
 assert.equal((await call('sync','POST',{...data,title:'changed'},a)).status,409);
 assert.deepEqual((await call('items','GET',undefined,b)).data,[]);
 const stale=await call('sync','POST',{...data,operationId:randomUUID(),title:'stale'},a);assert.equal(stale.status,409);assert.equal(stale.data.item.title,'First');
 const updates=await Promise.all(['A','B'].map(title=>call('sync','POST',{...data,operationId:randomUUID(),baseVersion:1,title},a)));assert.deepEqual(updates.map(r=>r.status).sort(),[200,409]);
 const remove=await call('sync','POST',{...data,operationId:randomUUID(),baseVersion:2,deleted:true},a);assert.equal(remove.status,200);assert.equal(remove.data.item.version,3);
 const resurrect=await call('sync','POST',{...data,operationId:randomUUID(),baseVersion:3},a);assert.equal(resurrect.status,409);assert.equal(resurrect.data.item.deleted,true);
 assert.equal((await call('items','GET',undefined,a)).data[0].deleted,true);
 await app.restart();assert.equal((await call('items','GET',undefined,a)).data[0].version,3);
 console.log('Sync server contract passed: auth/isolation, replay, key misuse, CAS concurrency, tombstones, restart.');
}finally{await app.close()}

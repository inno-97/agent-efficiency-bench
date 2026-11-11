import assert from 'node:assert/strict';
const base='http://127.0.0.1:3417';
let lastError;
for(let n=0;n<30;n++){
 try{
  const res=await fetch(base+'/api/health',{signal:AbortSignal.timeout(2000)});
  assert.equal(res.status,200);assert.deepEqual(await res.json(),{ok:true,database:'postgresql'});
  const page=await fetch(base,{signal:AbortSignal.timeout(2000)});assert.equal(page.status,200);
  assert.match(await page.text(),/environment preparation/);
  console.log('OK Next.js production page → API → PostgreSQL');process.exit(0);
 }catch(e){lastError=e;await new Promise(resolve=>setTimeout(resolve,1000));}
}
console.error('Web preparation failed:',lastError.message);process.exitCode=1;

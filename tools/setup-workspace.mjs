import {resolve,join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {readFile,writeFile,access} from 'node:fs/promises';
import {randomBytes} from 'node:crypto';
import {execFileSync} from 'node:child_process';
const repo=fileURLToPath(new URL('../',import.meta.url));
try{
 const root=resolve(process.argv[2]||'');if(!process.argv[2])throw Error('Pass a prepared web candidate folder');
 const meta=JSON.parse(await readFile(join(root,'task.json'),'utf8'));if(!['bookmarks','issues'].includes(meta.suite))throw Error('Only L3/L4 web candidates supported');
 try{await access(join(root,'.env'));throw Error('Candidate .env exists; refusing to overwrite')}catch(e){if(e.code!=='ENOENT')throw e}
 const raw=await readFile(join(repo,'preparation/web/.env'),'utf8');const configured=process.env.BENCH_DATABASE_URL||raw.match(/^DATABASE_URL=["']?([^"'\n]+)/m)?.[1];if(!configured)throw Error('Run npm run env:init');
 const url=new URL(configured);url.searchParams.set('schema','bench_dev_'+randomBytes(8).toString('hex'));
 await writeFile(join(root,'.env'),`DATABASE_URL="${url}"\n`,{flag:'wx',mode:0o600});
 const env={...process.env,DATABASE_URL:url.toString(),NEXT_TELEMETRY_DISABLED:'1'};
 for(const args of [['ci'],['run','db:generate'],['run','db:push'],['run','db:seed']])execFileSync('npm',args,{cwd:root,env,stdio:'inherit',timeout:600000});
 console.log('Candidate prepared with its own development schema. Start timing after setup; npm run dev to open UI. Evaluation uses a separate disposable schema.');
}catch(e){console.error(e.message.replace(/postgresql:\/\/[^\s"']+/g,'[DATABASE_URL]'));process.exitCode=2}

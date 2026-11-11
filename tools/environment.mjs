import {randomBytes} from 'node:crypto';
import {readFile,writeFile} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('../',import.meta.url));
const envPath=new URL('../.env',import.meta.url);
const action=process.argv[2];
try{
 if(action==='init'){
  try{await writeFile(envPath,`POSTGRES_PORT=55432\nPOSTGRES_PASSWORD=${randomBytes(24).toString('hex')}\n`,{flag:'wx',mode:0o600});console.log('Created local .env (credentials are not printed).');}
  catch(e){if(e.code!=='EEXIST')throw e;console.log('Keeping existing .env.');}
  const raw=await readFile(envPath,'utf8');
  const values=Object.fromEntries(raw.split('\n').filter(Boolean).map(line=>{const n=line.indexOf('=');return [line.slice(0,n),line.slice(n+1)];}));
  if(!/^[0-9]+$/.test(values.POSTGRES_PORT)||!values.POSTGRES_PASSWORD)throw Error('Invalid generated .env');
  const url=`postgresql://benchmark:${encodeURIComponent(values.POSTGRES_PASSWORD)}@127.0.0.1:${values.POSTGRES_PORT}/benchmark?schema=public`;
  await writeFile(new URL('../preparation/web/.env',import.meta.url),`DATABASE_URL="${url}"\n`,{mode:0o600});
  console.log('Prepared preparation/web/.env.');
 }else{
  process.loadEnvFile(envPath);
  const commands={up:['up','-d','--wait'],down:['down'],check:['exec','-T','db','psql','-U','benchmark','-d','benchmark','-v','ON_ERROR_STOP=1','-c','SELECT current_database(), version();']};
  if(!commands[action])throw Error('Usage: node tools/environment.mjs init|up|down|check');
  execFileSync('docker',['compose',...commands[action]],{cwd:root,stdio:'inherit',timeout:180000});
 }
}catch(e){console.error(e.message);process.exitCode=1;}

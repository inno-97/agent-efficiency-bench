import {execFileSync,spawnSync} from 'node:child_process';
import {existsSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {join} from 'node:path';
const env=fileURLToPath(new URL('../.env',import.meta.url));
if(existsSync(env))process.loadEnvFile(env);
let failed=0;
function check(name,fn){try{console.log(`OK ${name}: ${fn()}`);}catch{console.log(`FAIL ${name}`);failed++;}}
const run=(bin,args)=>execFileSync(bin,args,{encoding:'utf8',timeout:15000,stdio:['ignore','pipe','pipe']}).trim();
check('Node 22',()=>{if(!process.versions.node.startsWith('22.'))throw Error();return process.version;});
check('Docker daemon',()=>run('docker',['info','--format','{{.ServerVersion}}']));
check('Compose',()=>run('docker',['compose','version','--short']));
check('PostgreSQL container',()=>run('docker',['compose','exec','-T','db','pg_isready','-U','benchmark','-d','benchmark']));
check('JDK 17',()=>{const result=spawnSync('java',['-version'],{encoding:'utf8',timeout:15000});if(result.status!==0||!result.stderr.match(/version \"17[.\"]/))throw Error();return result.stderr.split('\n')[0];});
check('Android SDK 35',()=>{const sdk=process.env.ANDROID_HOME||process.env.ANDROID_SDK_ROOT;if(!sdk||!existsSync(join(sdk,'platforms/android-35/android.jar')))throw Error();return 'installed';});
process.exitCode=failed?1:0;

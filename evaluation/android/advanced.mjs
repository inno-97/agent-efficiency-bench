import {cp,mkdtemp,mkdir,readFile,rm,copyFile} from 'node:fs/promises';
import {resolve,join,basename} from 'node:path';
import {tmpdir} from 'node:os';
import {fileURLToPath} from 'node:url';
import {randomUUID} from 'node:crypto';
import {execFileSync} from 'node:child_process';
const here=fileURLToPath(new URL('.',import.meta.url));
function run(bin,args,options={}){try{return execFileSync(bin,args,{encoding:'utf8',timeout:600000,maxBuffer:16*1024*1024,...options})}catch(e){throw Error(`${bin} failed:\n${String(e.stdout||'').slice(-7000)}\n${String(e.stderr||'').slice(-2000)}`)}}
export async function evaluateAdvanced(candidate,serial){
 if(!/^emulator-\d+$/.test(serial||''))throw Error('Explicit emulator serial required; physical devices never modified');
 const sdk=process.env.ANDROID_HOME||process.env.ANDROID_SDK_ROOT;if(!sdk)throw Error('Set ANDROID_HOME');
 const adb=join(sdk,'platform-tools',process.platform==='win32'?'adb.exe':'adb'),device=(...args)=>run(adb,['-s',serial,...args],{timeout:180000});
 if(device('shell','getprop','ro.build.version.sdk').trim()!=='35')throw Error('API35 emulator required');
 const root=resolve(candidate),meta=JSON.parse(await readFile(join(root,'task.json'),'utf8'));
 if(!['notes','sync'].includes(meta.suite))throw Error('Unknown advanced mobile suite');
 const peer=process.env.BENCH_PEER_EMULATOR;
 if(meta.suite==='sync'&&(!/^emulator-\d+$/.test(peer||'')||peer===serial))throw Error('L4 sync requires a distinct BENCH_PEER_EMULATOR API35 emulator');
 const peerDevice=(...args)=>run(adb,['-s',peer,...args],{timeout:180000});
 if(meta.suite==='sync'&&peerDevice('shell','getprop','ro.build.version.sdk').trim()!=='35')throw Error('Peer requires API35');
 const temp=await mkdtemp(join(tmpdir(),'agent-bench-kotlin-'));
 try{
 const build=join(temp,'candidate');await cp(root,build,{recursive:true,filter:p=>p===root||!['.git','.gradle','build','local.properties'].includes(basename(p))});
 await rm(join(build,'app/src/androidTest'),{recursive:true,force:true});await rm(join(build,'app/src/test'),{recursive:true,force:true});
 const tests=join(build,'app/src/androidTest/java/bench/app');await mkdir(tests,{recursive:true});await copyFile(join(here,meta.suite+'-tests.kt'),join(tests,'BenchTest.kt'));
 run('sh',['gradlew','--console=plain','assembleDebug','assembleDebugAndroidTest'],{cwd:build});
 device('install','-r','-t',join(build,'app/build/outputs/apk/debug/app-debug.apk'));device('install','-r','-t',join(build,'app/build/outputs/apk/androidTest/debug/app-debug-androidTest.apk'));device('shell','am','force-stop','bench.app');device('shell','pm','clear','bench.app');
 const marker='Cross-'+randomUUID();
 const phase=(name,target=device)=>{const out=target('shell','am','instrument','--user','0','-w','-r','-e','class','bench.app.BenchTest','-e','phase',name,'-e','marker',marker,'bench.app.test/androidx.test.runner.AndroidJUnitRunner');if(!/OK \(1 test\)/.test(out))throw Error('Instrumentation infrastructure failure: '+out);return JSON.parse(target('shell','run-as','bench.app','cat','files/bench-report.json'))};
 const report=phase('main');device('shell','am','force-stop','bench.app');const seed=phase('seed');device('shell','am','force-stop','bench.app');const probe=phase('probe');
 const result={name:'process/restart-persistence',passed:seed.passed===seed.total&&probe.passed===probe.total,...(seed.passed!==seed.total||probe.passed!==probe.total?{error:JSON.stringify({seed,probe})}:{})};report.results.push(result);report.total++;if(result.passed)report.passed++;
 if(meta.suite==='sync'){
 peerDevice('install','-r','-t',join(build,'app/build/outputs/apk/debug/app-debug.apk'));peerDevice('install','-r','-t',join(build,'app/build/outputs/apk/androidTest/debug/app-debug-androidTest.apk'));peerDevice('shell','am','force-stop','bench.app');peerDevice('shell','pm','clear','bench.app');
 const seed=phase('cross-seed'),remote=phase('cross-peer',peerDevice),verify=phase('cross-verify');const cross={name:'sync/two-emulator-propagation',passed:[seed,remote,verify].every(r=>r.passed===r.total)};if(!cross.passed)cross.error=JSON.stringify({seed,remote,verify});report.results.push(cross);report.total++;if(cross.passed)report.passed++;
 }
 return {task:meta.id,version:meta.version,candidate:root,platform:'android',api:35,serial,...report};
 }finally{await rm(temp,{recursive:true,force:true})}
}

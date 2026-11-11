import {cp,mkdtemp,mkdir,readFile,writeFile,rm,copyFile} from 'node:fs/promises';
import {resolve,join,basename} from 'node:path';
import {tmpdir} from 'node:os';
import {fileURLToPath} from 'node:url';
import {execFileSync} from 'node:child_process';
const here=fileURLToPath(new URL('.',import.meta.url));
function run(bin,args,options={}){try{return execFileSync(bin,args,{encoding:'utf8',timeout:600000,maxBuffer:16*1024*1024,...options});}catch(e){throw Error(`${bin} ${args.join(' ')} failed:\n${String(e.stdout||'').slice(-6000)}\n${String(e.stderr||'').slice(-3000)}`);}}
export async function evaluateAndroid(candidate,serial){
 if(!/^emulator-\d+$/.test(serial||''))throw Error('Explicit emulator serial required; physical devices are not modified.');
 if(!process.env.ANDROID_HOME&&!process.env.ANDROID_SDK_ROOT)throw Error('Set ANDROID_HOME to SDK directory.');
 const sdk=(process.env.ANDROID_HOME||process.env.ANDROID_SDK_ROOT),adb=join(sdk,'platform-tools',process.platform==='win32'?'adb.exe':'adb');
 const device=(...args)=>run(adb,['-s',serial,...args],{timeout:180000});
 if(device('shell','getprop','ro.build.version.sdk').trim()!=='35')throw Error('Evaluation requires Android API 35 emulator.');
 const root=resolve(candidate),meta=JSON.parse(await readFile(join(root,'task.json'),'utf8'));
 if(meta.domain!=='mobile'||!['habit','workout'].includes(meta.suite))throw Error('Unknown mobile suite');
 const temp=await mkdtemp(join(tmpdir(),'agent-bench-android-'));
 try{
 const build=join(temp,'app');
 await cp(root,build,{recursive:true,filter:path=>path===root||!['.git','.gradle','build','local.properties'].includes(basename(path))});
 // Candidate-authored tests never become the evaluator's tests.
 await rm(join(build,'app/src/androidTest'),{recursive:true,force:true});
 const tests=join(build,'app/src/androidTest/java/bench/evaluation');await mkdir(tests,{recursive:true});
 await copyFile(join(here,meta.suite+'-runner.java'),join(tests,'BenchRunner.java'));
 const gradle=process.platform==='win32'?'cmd':'sh';
 const args=process.platform==='win32'?['/c','gradlew.bat']:['gradlew'];
 run(gradle,[...args,'--console=plain','assembleDebug','assembleDebugAndroidTest'],{cwd:build});
 device('install','-r','-t',join(build,'app/build/outputs/apk/debug/app-debug.apk'));
 device('install','-r','-t',join(build,'app/build/outputs/apk/androidTest/debug/app-debug-androidTest.apk'));
 device('shell','am','force-stop','bench.app');
 device('shell','pm','clear','bench.app');
 const output=device('shell','am','instrument','-w','-r','bench.app.test/bench.evaluation.BenchRunner');
 const line=output.split(/\r?\n/).find(line=>line.startsWith('BENCH_RESULT='));
 if(!line)throw Error('Instrumentation failed without a report: '+output);
 const report={task:meta.id,version:meta.version,candidate:root,platform:'android',serial,api:35,...JSON.parse(line.slice('BENCH_RESULT='.length))};
 // A second instrumentation process checks storage after a real force-stop.
 device('shell','am','force-stop','bench.app');
 const probeOutput=device('shell','am','instrument','-w','-r','-e','probe','true','bench.app.test/bench.evaluation.BenchRunner');
 const probeLine=probeOutput.split(/\r?\n/).find(line=>line.startsWith('BENCH_PROBE='));
 if(!probeLine)throw Error('Restart probe failed without a report: '+probeOutput);
 const probe=JSON.parse(probeLine.slice('BENCH_PROBE='.length));
 report.processRestart=probe;
 if(!probe.passed){const result=report.results.find(r=>r.name===(meta.suite==='habit'?'ui/relaunch-persistence':'ui/create-detail-relaunch'));if(result.passed){result.passed=false;report.passed--;}result.error='Process restart: '+probe.error;}
 if(report.total!==12||report.results?.length!==12)throw Error('Invalid instrumentation report');
 return report;
 }finally{await rm(temp,{recursive:true,force:true});}
}
if(process.argv[1]===fileURLToPath(import.meta.url)){
 try{
 if(!process.argv[2])throw Error('Usage: npm run evaluate:android -- <candidate> <emulator-serial> [report.json]');
 const report=await evaluateAndroid(process.argv[2],process.argv[3]);console.log(JSON.stringify(report,null,2));
 if(process.argv[4])await writeFile(process.argv[4],JSON.stringify(report,null,2)+'\n');
 process.exitCode=report.passed===report.total?0:1;
 }catch(e){console.error('EVALUATOR_ERROR:',e.message);process.exitCode=2;}
}

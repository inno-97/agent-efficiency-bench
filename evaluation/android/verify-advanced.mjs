import {mkdtemp,cp,copyFile,rm,writeFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join,basename} from 'node:path';
import assert from 'node:assert/strict';
import {evaluateAdvanced} from './advanced.mjs';
import {isolatedApp} from '../workspace.mjs';
const serial=process.argv[2];if(!/^emulator-\d+$/.test(serial||''))throw Error('Pass explicit API35 emulator serial');
const temp=await mkdtemp(join(tmpdir(),'verify-advanced-'));let server;const reports=[];
try{for(const [slug,suite] of [['l3-offline-notes','notes'],['l4-synced-checklist','sync']]){
 if(process.env.BENCH_TASK_FILTER&&process.env.BENCH_TASK_FILTER!==suite)continue;
 if(suite==='sync')server=await isolatedApp('evaluation/sync-server',{port:3418});
 for(const kind of ['build','fix']){
 const source='benchmarks/mobile/'+kind+'/'+slug,target=join(temp,kind+'-'+slug);
 await cp(source+'/starter',target,{recursive:true,filter:p=>!['.gradle','build','local.properties'].includes(basename(p))});await copyFile(source+'/task.json',join(target,'task.json'));
 const baseline=await evaluateAdvanced(target,serial);console.log(baseline.task,'baseline',baseline.passed+'/'+baseline.total);assert.ok(baseline.passed<baseline.total);
 if(kind==='fix')assert.deepEqual(baseline.results.filter(r=>!r.passed).map(r=>r.name),suite==='notes'?['notes/validation-atomic','photo/edit-preserves-attachment','photo/remove-persists-cleans']:['offline/crud-validation','sync/conflict-server-wins','sync/delete-tombstone-propagates','sync/stale-edit-cannot-resurrect']);
 await copyFile('evaluation/fixtures/reference-'+suite+'.kt',join(target,'app/src/main/java/bench/app/Repository.kt'));
 const reference=await evaluateAdvanced(target,serial);console.log(reference.task,'reference',reference.passed+'/'+reference.total);assert.equal(reference.passed,reference.total,JSON.stringify(reference.results.filter(r=>!r.passed)));
 reports.push({task:baseline.task,baseline,reference});
 if(process.argv[3])await writeFile(process.argv[3],JSON.stringify(reports,null,2)+'\n');
 }
 }if(process.argv[3])await writeFile(process.argv[3],JSON.stringify(reports,null,2)+'\n');
}finally{if(server)await server.close();await rm(temp,{recursive:true,force:true})}

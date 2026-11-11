import {cp,mkdtemp,copyFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {fileURLToPath} from 'node:url';
import assert from 'node:assert/strict';
import {evaluateAndroid} from './evaluate.mjs';
const repo=fileURLToPath(new URL('../../',import.meta.url));
const temp=await mkdtemp(join(tmpdir(),'agent-bench-mobile-verify-'));
try{
 for(const [kind,slug,suite] of [['build','l1-habit-checker','habit'],['fix','l1-habit-restore','habit'],['build','l2-workout-log','workout'],['fix','l2-workout-summary','workout']]){
 const source=join(repo,'benchmarks/mobile',kind,slug),target=join(temp,kind+'-'+suite);
 await cp(join(source,'starter'),target,{recursive:true});await copyFile(join(source,'task.json'),join(target,'task.json'));
 const baseline=await evaluateAndroid(target,process.argv[2]);console.log(slug,'baseline',baseline.passed+'/'+baseline.total,baseline.results.filter(r=>!r.passed).map(r=>r.name));
 assert.equal(baseline.total,12);assert.ok(baseline.passed<12);
 if(kind==='fix')assert.deepEqual(baseline.results.filter(r=>!r.passed).map(r=>r.name),suite==='habit'?['logic/storage-roundtrip','ui/relaunch-persistence']:['logic/update','logic/volume','ui/create-detail-relaunch','ui/edit-detail-list','ui/edit-date']);
 await copyFile(join(repo,'evaluation/fixtures/reference-'+suite+'.java'),join(target,'app/src/main/java/bench/app/TrackerModel.java'));
 const solved=await evaluateAndroid(target,process.argv[2]);console.log(slug,'reference',solved.passed+'/'+solved.total);
 assert.equal(solved.passed,12,JSON.stringify(solved.results.filter(r=>!r.passed)));
 }
}finally{await rm(temp,{recursive:true,force:true});}

import {mkdtemp,cp,copyFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import assert from 'node:assert/strict';
import {evaluate} from './evaluate.mjs';
const tasks=['benchmarks/web/build/l1-todo','benchmarks/web/fix/l1-todo-delete'];
const temp=await mkdtemp(join(tmpdir(),'agent-bench-verify-'));
try{
 for(const task of tasks){
 const target=join(temp,task.includes('/fix/')?'fix':'build');
 await cp(task+'/starter',target,{recursive:true});
 const baseline=await evaluate(target);
 console.log(task,'baseline',baseline.passed+'/'+baseline.total);
 assert.equal(baseline.total,12);assert.ok(baseline.passed<12);
 if(task.includes('/fix/')){
  assert.equal(baseline.passed,9);
  assert.deepEqual(baseline.results.filter(r=>!r.passed).map(r=>r.name),['logic/delete-by-id','ui/delete-active-filter','ui/delete-completed-filter']);
 }
 await copyFile('evaluation/fixtures/reference-todo.js',join(target,'todo.js'));
 const solved=await evaluate(target);console.log(task,'reference',solved.passed+'/'+solved.total);
 assert.equal(solved.passed,12,JSON.stringify(solved.results.filter(r=>!r.passed)));
 }
}finally{await rm(temp,{recursive:true,force:true});}

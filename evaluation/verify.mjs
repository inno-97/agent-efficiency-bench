import {mkdtemp,cp,copyFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import assert from 'node:assert/strict';
import {evaluate} from './evaluate.mjs';
const tasks=['benchmarks/web/build/l1-todo','benchmarks/web/fix/l1-todo-delete','benchmarks/web/build/l2-expense-tracker','benchmarks/web/fix/l2-expense-summary'];
const temp=await mkdtemp(join(tmpdir(),'agent-bench-verify-'));
try{
 for(const task of tasks){
 const target=join(temp,task.split('/').slice(-2).join('-'));
 await cp(task+'/starter',target,{recursive:true});
 await copyFile(task+'/task.json',join(target,'task.json'));
 const baseline=await evaluate(target);
 console.log(task,'baseline',baseline.passed+'/'+baseline.total);
 assert.equal(baseline.total,12);assert.ok(baseline.passed<12);
 if(task.includes('/fix/l1-')){
  assert.equal(baseline.passed,9);
  assert.deepEqual(baseline.results.filter(r=>!r.passed).map(r=>r.name),['logic/delete-by-id','ui/delete-active-filter','ui/delete-completed-filter']);
 }
 if(task.includes('/fix/l2-')){
  assert.deepEqual(baseline.results.filter(r=>!r.passed).map(r=>r.name),['logic/update','logic/year-month-filter','ui/year-category-filter','ui/edit-delete-total']);
 }
 const suite=task.includes('/l2-')?'expense':'todo';
 await copyFile('evaluation/fixtures/reference-'+suite+'.js',join(target,suite+'.js'));
 const solved=await evaluate(target);console.log(task,'reference',solved.passed+'/'+solved.total);
 assert.equal(solved.passed,12,JSON.stringify(solved.results.filter(r=>!r.passed)));
 }
}finally{await rm(temp,{recursive:true,force:true});}

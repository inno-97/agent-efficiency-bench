import {mkdtemp,cp,copyFile,rm,writeFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join,basename} from 'node:path';
import assert from 'node:assert/strict';
import {evaluateWorkspace} from './workspace.mjs';
const temp=await mkdtemp(join(tmpdir(),'verify-workspace-'));
const reports=[];
try{for(const slug of ['l3-bookmark-library','l4-team-issue-board'])for(const kind of ['build','fix']){
 const source='benchmarks/web/'+kind+'/'+slug,target=join(temp,kind+'-'+slug);
 await cp(source+'/starter',target,{recursive:true,filter:p=>!['node_modules','.next','.env'].includes(basename(p))});await copyFile(source+'/task.json',join(target,'task.json'));
 const baseline=await evaluateWorkspace(target);console.log(baseline.task,'baseline',baseline.passed+'/'+baseline.total);assert.ok(baseline.passed<baseline.total);
 if(kind==='fix')assert.deepEqual(baseline.results.filter(r=>!r.passed).map(r=>r.name),slug.startsWith('l3')?['bookmark/isolation-direct','bookmark/isolation-edit','bookmark/isolation-delete']:['project/direct-isolation','issue/author-owner-edit','member/removal-revokes-existing-session']);
 await copyFile('evaluation/fixtures/reference-workspace.ts',join(target,'lib/service.ts'));
 const reference=await evaluateWorkspace(target);console.log(reference.task,'reference',reference.passed+'/'+reference.total);assert.equal(reference.passed,reference.total,JSON.stringify(reference.results.filter(r=>!r.passed)));
 reports.push({task:baseline.task,baseline,reference});
 }if(process.argv[2])await writeFile(process.argv[2],JSON.stringify(reports,null,2)+'\n');
}finally{await rm(temp,{recursive:true,force:true})}

import {readdir,readFile,cp,mkdir} from 'node:fs/promises';
import {resolve,join,relative,sep,isAbsolute} from 'node:path';
import {fileURLToPath} from 'node:url';
const repo=fileURLToPath(new URL('../',import.meta.url));
try{
 const [id,destination]=process.argv.slice(2);
 if(!id||!destination)throw Error('Usage: npm run prepare -- <task-id> <new-directory>');
 const target=resolve(destination),rel=relative(repo,target);
 if(!(rel==='..'||rel.startsWith('..'+sep)||isAbsolute(rel)))throw Error('Use a directory outside the evaluator repository');
 let found;
 for(const domain of ['web','mobile'])for(const kind of ['build','fix']){
  const parent=join(repo,'benchmarks',domain,kind);
  for(const slug of await readdir(parent)){
   const folder=join(parent,slug),meta=JSON.parse(await readFile(join(folder,'task.json'),'utf8'));
   if(meta.id===id)found=folder;
  }
 }
 if(!found)throw Error('Unknown task ID: '+id);
 await mkdir(target); // Existing folders are never overwritten.
 await cp(join(found,'starter'),target,{recursive:true});
 for(const name of ['spec.md','prompt.md','acceptance.md','task.json'])await cp(join(found,name),join(target,name));
 console.log(`Prepared ${id} at ${target}\nInitialize a Git repository there and give prompt.md to your agent.`);
}catch(e){console.error(e.message);process.exitCode=1;}

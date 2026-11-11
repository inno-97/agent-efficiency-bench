import assert from 'node:assert/strict';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {writeFile} from 'node:fs/promises';
import {serve} from '../tools/serve.mjs';

export async function evaluate(candidate){
 const root=resolve(candidate), results=[];
 const test=async(name,fn)=>{try{await fn();results.push({name,passed:true});}catch(e){results.push({name,passed:false,error:e.message});}};
 // Import errors are infrastructure/contract errors and must not look like a scored run.
 const m=await import(pathToFileURL(resolve(root,'todo.js')).href+'?run='+Date.now());
 const fixture=()=>[{id:'a',title:'A',completed:true},{id:'b',title:'B',completed:false},{id:'c',title:'C',completed:false}];
 const storage=()=>{let value=null;return {getItem:()=>value,setItem:(_,v)=>{value=v;}};};
 await test('logic/add',()=>{const data=[];const a=m.addTodo(data,'  same  ');const b=m.addTodo(a,'same');assert.equal(data.length,0);assert.equal(a.length,1);assert.equal(b.length,2);assert.equal(b[0].title,'same');assert.equal(b[1].completed,false);assert.equal(typeof b[1].id,'string');assert.ok(b[1].id);assert.notEqual(b[0].id,b[1].id);});
 await test('logic/validation',()=>{for(const t of ['', '  ', 'x'.repeat(121)])assert.throws(()=>m.addTodo([],t));assert.equal(m.addTodo([],'x'.repeat(120))[0].title.length,120);});
 await test('logic/toggle',()=>{const x=fixture();const before=JSON.stringify(x);const y=m.toggleTodo(x,'b');assert.deepEqual(y.map(t=>t.completed),[true,true,false]);assert.equal(JSON.stringify(x),before);assert.deepEqual(m.toggleTodo(y,'b'),x);assert.deepEqual(m.toggleTodo(x,'missing'),x);});
 await test('logic/delete-by-id',()=>{const x=fixture();const before=JSON.stringify(x);assert.deepEqual(m.deleteTodo(x,'b').map(t=>t.id),['a','c']);assert.deepEqual(m.deleteTodo(x,'a').map(t=>t.id),['b','c']);assert.deepEqual(m.deleteTodo(x,'missing'),x);assert.equal(JSON.stringify(x),before);});
 await test('logic/filters',()=>{const x=fixture();assert.deepEqual(m.visibleTodos(x,'all'),x);assert.deepEqual(m.visibleTodos(x,'active').map(t=>t.id),['b','c']);assert.deepEqual(m.visibleTodos(x,'completed').map(t=>t.id),['a']);assert.equal(x.length,3);});
 await test('logic/persistence',()=>{const s=storage();assert.deepEqual(m.loadTodos(s),[]);m.saveTodos(s,fixture());assert.deepEqual(m.loadTodos(s),fixture());});
 await test('logic/corrupt-storage',()=>{for(const raw of ['{broken','null','{}','42']){const s=storage();s.setItem('',raw);assert.deepEqual(m.loadTodos(s),[]);}});
 await test('logic/storage-validation',()=>{const s=storage();s.setItem('',JSON.stringify([null,{}, {id:1,title:'a',completed:false},{id:'x',title:' ',completed:false},{id:'x',title:'x'.repeat(121),completed:false},{id:'x',title:'a',completed:'false'},...fixture()]));assert.deepEqual(m.loadTodos(s),fixture());});
 const {chromium}=await import('playwright');
 const browser=await chromium.launch({headless:true});
 const app=await serve(root);
 const ui=async(name,fn)=>test(name,async()=>{const context=await browser.newContext();const page=await context.newPage();page.setDefaultTimeout(5000);try{await page.goto(app.url);await fn(page);}finally{await context.close();}});
 const add=async(page,title)=>{await page.locator('#title').fill(title);await page.locator('#add-form button').click();};
 const titles=page=>page.locator('#todos li span').allTextContents();
 try{
 await ui('ui/add-complete-reload',async page=>{await add(page,'A');await add(page,'B');assert.deepEqual(await titles(page),['A','B']);await page.locator('#todos li').first().locator('input[type=checkbox]').check();assert.match(await page.locator('#remaining').innerText(),/1/);await page.reload();assert.deepEqual(await titles(page),['A','B']);assert.equal(await page.locator('#todos li').first().locator('input').isChecked(),true);});
 await ui('ui/delete-active-filter',async page=>{await add(page,'A');await add(page,'B');await add(page,'C');await page.locator('#todos li').first().locator('input').check();await page.locator('#filter').selectOption('active');await page.locator('#todos li').first().locator('button').click();assert.deepEqual(await titles(page),['C']);await page.locator('#filter').selectOption('all');assert.deepEqual(await titles(page),['A','C']);await page.reload();assert.deepEqual(await titles(page),['A','C']);});
 await ui('ui/delete-completed-filter',async page=>{await add(page,'A');await add(page,'B');await page.locator('#todos li').nth(1).locator('input').check();await page.locator('#filter').selectOption('completed');await page.locator('#todos li button').click();assert.deepEqual(await titles(page),[]);await page.locator('#filter').selectOption('all');assert.deepEqual(await titles(page),['A']);});
 await ui('ui/text-and-empty-input',async page=>{await add(page,'   ');assert.deepEqual(await titles(page),[]);assert.ok(await page.locator('#error').innerText());const payload='<img src=x onerror="window.__executed=1">';await add(page,payload);assert.deepEqual(await titles(page),[payload]);assert.equal(await page.locator('#todos img').count(),0);assert.equal(await page.evaluate(()=>window.__executed),undefined);});
 }finally{await browser.close();await app.close();}
 return {candidate:root,total:results.length,passed:results.filter(r=>r.passed).length,results};
}
if(process.argv[1]===new URL(import.meta.url).pathname){
 try{
 if(!process.argv[2])throw new Error('Usage: npm run evaluate -- <candidate-directory> [report.json]');
 const report=await evaluate(process.argv[2]);console.log(JSON.stringify(report,null,2));
 if(process.argv[3])await writeFile(process.argv[3],JSON.stringify(report,null,2)+'\n');
 process.exitCode=report.passed===report.total?0:1;
 }catch(error){console.error('EVALUATOR_ERROR:',error.message);process.exitCode=2;}
}

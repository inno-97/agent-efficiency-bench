import assert from 'node:assert/strict';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {serve} from '../tools/serve.mjs';
export async function evaluateExpense(candidate){
 const root=resolve(candidate),results=[];
 const test=async(name,fn)=>{try{await fn();results.push({name,passed:true});}catch(e){results.push({name,passed:false,error:e.message});}};
 const m=await import(pathToFileURL(resolve(root,'expense.js')).href+'?t='+Date.now());
 const item=(over={})=>({title:'Lunch',amount:100,date:'2026-01-01',category:'food',...over});
 const rows=()=>[{id:'old',...item({date:'2025-01-01',amount:999})},{id:'a',...item()},{id:'b',...item({amount:200,category:'transport'})},{id:'c',...item({date:'2026-02-01',amount:400})}];
 const store=()=>{let v=null;return {getItem:()=>v,setItem:(_,n)=>{v=n;}};};
 await test('logic/add',()=>{const x=[];const a=m.addExpense(x,item({title:' Lunch '}));const b=m.addExpense(a,item());assert.equal(x.length,0);assert.equal(a.length,1);assert.equal(b.length,2);assert.equal(a[0].title,'Lunch');assert.ok(b[1].id);assert.notEqual(b[0].id,b[1].id);});
 await test('logic/validation',()=>{for(const input of [item({title:' '}),item({title:'x'.repeat(81)}),item({amount:0}),item({amount:1.5}),item({amount:100000001}),item({amount:'2'}),item({date:'2026-02-30'}),item({date:'2026-13-01'}),item({category:'unknown'})])assert.throws(()=>m.addExpense([],input));assert.equal(m.addExpense([],item({date:'2024-02-29',amount:100000000})).length,1);});
 await test('logic/update',()=>{const x=rows(),before=JSON.stringify(x);const next=item({title:' Changed ',amount:300,date:'2026-02-15',category:'other'});assert.deepEqual(m.updateExpense(x,'a',next)[1],{id:'a',...next,title:'Changed'});assert.deepEqual(m.updateExpense(x,'missing',next),x);assert.equal(JSON.stringify(x),before);assert.throws(()=>m.updateExpense(x,'a',item({amount:-1})));});
 await test('logic/delete',()=>{const x=rows(),before=JSON.stringify(x);assert.deepEqual(m.deleteExpense(x,'a').map(r=>r.id),['old','b','c']);assert.deepEqual(m.deleteExpense(x,'none'),x);assert.equal(JSON.stringify(x),before);});
 await test('logic/year-month-filter',()=>{const x=rows();assert.deepEqual(m.selectExpenses(x,'2026-01').map(r=>r.id),['a','b']);assert.deepEqual(m.selectExpenses(x,'2026-01','food').map(r=>r.id),['a']);assert.deepEqual(m.selectExpenses(x,'2026-03'),[]);assert.equal(x.length,4);});
 await test('logic/total',()=>{assert.equal(m.totalExpenses([]),0);assert.equal(m.totalExpenses([{amount:10},{amount:20}]),30);});
 await test('logic/storage-roundtrip',()=>{const s=store();assert.deepEqual(m.loadExpenses(s),[]);m.saveExpenses(s,rows());assert.deepEqual(m.loadExpenses(s),rows());});
 await test('logic/storage-recovery',()=>{for(const raw of ['{','{}','null','42']){const s=store();s.setItem('',raw);assert.deepEqual(m.loadExpenses(s),[]);}const s=store();s.setItem('',JSON.stringify([null,{},...rows(),{id:'bad',...item({amount:-1})}]));assert.deepEqual(m.loadExpenses(s),rows());});
 const {chromium}=await import('playwright');const browser=await chromium.launch();let app;
 try{app=await serve(root);
 const ui=(name,fn)=>test(name,async()=>{const context=await browser.newContext();const page=await context.newPage();page.setDefaultTimeout(5000);try{await page.goto(app.url);await page.locator('#month').fill('2026-01');await fn(page);}finally{await context.close();}});
 const add=async(page,title,amount,date='2026-01-01',category='food')=>{await page.locator('#title').fill(title);await page.locator('#amount').fill(String(amount));await page.locator('#date').fill(date);await page.locator('#category').selectOption(category);await page.locator('#expense-form button').first().click();};
 const total=async(page,n)=>assert.equal(await page.locator('#total').innerText(),String(n));
 await ui('ui/add-reload',async page=>{await add(page,'A',100);await add(page,'B',200,'2026-01-02','transport');assert.equal(await page.locator('#rows li').count(),2);await total(page,300);await page.reload();await page.locator('#month').fill('2026-01');await total(page,300);assert.equal(await page.locator('#rows li').count(),2);});
 await ui('ui/year-category-filter',async page=>{await add(page,'Old',999,'2025-01-01');await add(page,'Food',100);await add(page,'Bus',200,'2026-01-01','transport');assert.equal(await page.locator('#rows li').count(),2);await total(page,300);await page.locator('#category-filter').selectOption('food');await total(page,100);assert.equal(await page.locator('#rows li').count(),1);});
 await ui('ui/edit-delete-total',async page=>{await add(page,'A',100);await page.locator('#rows .edit').click();await page.locator('#amount').fill('350');await page.locator('#expense-form button').first().click();await total(page,350);await page.reload();await page.locator('#month').fill('2026-01');await total(page,350);await page.locator('#rows .delete').click();await total(page,0);assert.equal(await page.locator('#rows li').count(),0);});
 await ui('ui/validation-text',async page=>{await add(page,' ',100);assert.equal(await page.locator('#rows li').count(),0);assert.ok(await page.locator('#error').innerText());await add(page,'<img src=x onerror="window.__executed=1">',100);assert.equal(await page.locator('#rows img').count(),0);assert.equal(await page.locator('#rows li').count(),1);assert.equal(await page.evaluate(()=>window.__executed),undefined);});
 }finally{await browser.close();if(app)await app.close();}
 return {candidate:root,total:results.length,passed:results.filter(r=>r.passed).length,results};
}

import {addExpense,updateExpense,deleteExpense,selectExpenses,totalExpenses,loadExpenses,saveExpenses} from './expense.js';
const $=s=>document.querySelector(s);let rows=loadExpenses(localStorage),editing=null;
$('#month').value=new Date().toISOString().slice(0,7);$('#date').value=new Date().toISOString().slice(0,10);
function render(){
 const visible=selectExpenses(rows,$('#month').value,$('#category-filter').value);
 $('#total').textContent=String(totalExpenses(visible));$('#rows').replaceChildren();
 for(const r of visible){const li=document.createElement('li');li.dataset.id=r.id;
 const span=document.createElement('span');span.textContent=`${r.date} ${r.title} ${r.amount} ${r.category}`;
 const edit=document.createElement('button');edit.textContent='수정';edit.className='edit';edit.onclick=()=>{editing=r.id;for(const k of ['title','amount','date','category'])$('#'+k).value=r[k];$('#cancel').hidden=false;};
 const del=document.createElement('button');del.textContent='삭제';del.className='delete';del.onclick=()=>{rows=deleteExpense(rows,r.id);if(editing===r.id)reset();saveExpenses(localStorage,rows);render();};li.append(span,edit,del);$('#rows').append(li);}
}
function reset(){editing=null;$('#title').value='';$('#amount').value='';$('#cancel').hidden=true;}
$('#expense-form').onsubmit=e=>{e.preventDefault();try{const input={title:$('#title').value,amount:Number($('#amount').value),date:$('#date').value,category:$('#category').value};rows=editing?updateExpense(rows,editing,input):addExpense(rows,input);saveExpenses(localStorage,rows);reset();$('#error').textContent='';render();}catch(err){$('#error').textContent=err.message;}};
$('#cancel').onclick=reset;$('#month').onchange=render;$('#category-filter').onchange=render;render();

import {addTodo,toggleTodo,deleteTodo,visibleTodos,loadTodos,saveTodos} from './todo.js';
const input=document.querySelector('#title'), filter=document.querySelector('#filter');
let todos=loadTodos(localStorage);
function render(){
 const list=document.querySelector('#todos'); list.replaceChildren();
 for(const todo of visibleTodos(todos,filter.value)){
  const row=document.createElement('li'); row.dataset.id=todo.id;
  const check=document.createElement('input');check.type='checkbox';check.checked=todo.completed;check.setAttribute('aria-label',todo.title+' 완료');
  check.onchange=()=>{todos=toggleTodo(todos,todo.id);saveTodos(localStorage,todos);render();};
  const label=document.createElement('span');label.textContent=todo.title;
  const del=document.createElement('button');del.textContent='삭제';del.setAttribute('aria-label',todo.title+' 삭제');
  del.onclick=()=>{todos=deleteTodo(todos,todo.id);saveTodos(localStorage,todos);render();};
  row.append(check,label,del);list.append(row);
 }
 document.querySelector('#remaining').textContent=`남은 할 일 ${todos.filter(t=>!t.completed).length}개`;
}
document.querySelector('#add-form').onsubmit=e=>{
 e.preventDefault();
 try{todos=addTodo(todos,input.value);saveTodos(localStorage,todos);input.value='';document.querySelector('#error').textContent='';render();}
 catch(err){document.querySelector('#error').textContent=err.message;}
};
filter.onchange=render;render();

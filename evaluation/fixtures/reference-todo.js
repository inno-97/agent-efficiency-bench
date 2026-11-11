export const STORAGE_KEY='agent-efficiency-todos-v1';
export function addTodo(todos,title){
 title=title.trim();if(!title||title.length>120)throw new Error('제목은 1~120자여야 합니다.');
 return [...todos,{id:crypto.randomUUID(),title,completed:false}];
}
export function toggleTodo(todos,id){return todos.map(t=>t.id===id?{...t,completed:!t.completed}:t);}
export function deleteTodo(todos,id){return todos.filter(t=>t.id!==id);}
export function visibleTodos(todos,filter){return todos.filter(t=>filter==='completed'?t.completed:filter==='active'?!t.completed:true);}
export function saveTodos(storage,todos){storage.setItem(STORAGE_KEY,JSON.stringify(todos));}
export function loadTodos(storage){
 try{const data=JSON.parse(storage.getItem(STORAGE_KEY)||'[]');
 if(!Array.isArray(data))return [];
 return data.filter(t=>t&&typeof t.id==='string'&&typeof t.title==='string'&&t.title.trim().length>0&&t.title.length<=120&&typeof t.completed==='boolean');
 }catch{return [];}
}

export const STORAGE_KEY='agent-efficiency-expenses-v1';
export const CATEGORIES=['food','transport','other'];
function validDate(date){if(typeof date!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(date))return false;const d=new Date(date+'T00:00:00Z');return !isNaN(d)&&d.toISOString().slice(0,10)===date;}
function clean(input){
 const title=typeof input.title==='string'?input.title.trim():'';
 if(!title||title.length>80)throw Error('제목은 1~80자');
 if(!Number.isSafeInteger(input.amount)||input.amount<1||input.amount>100000000)throw Error('금액은 1~100000000 정수');
 if(!validDate(input.date))throw Error('날짜 오류');
 if(!CATEGORIES.includes(input.category))throw Error('분류 오류');
 return {title,amount:input.amount,date:input.date,category:input.category};
}
export function addExpense(rows,input){return [...rows,{id:crypto.randomUUID(),...clean(input)}];}
export function updateExpense(rows,id,input){const next=clean(input);return rows.map(r=>r.id===id?{...r,title:next.title,date:next.date,category:next.category}:r);}
export function deleteExpense(rows,id){return rows.filter(r=>r.id!==id);}
export function selectExpenses(rows,month,category='all'){
 return rows.filter(r=>r.date.slice(5,7)===month.slice(5,7)&&(category==='all'||r.category===category));
}
export function totalExpenses(rows){return rows.reduce((sum,r)=>sum+r.amount,0);}
export function saveExpenses(storage,rows){storage.setItem(STORAGE_KEY,JSON.stringify(rows));}
export function loadExpenses(storage){try{const rows=JSON.parse(storage.getItem(STORAGE_KEY)||'[]');if(!Array.isArray(rows))return [];return rows.filter(r=>{try{return typeof r.id==='string'&&r.id.length>0&&!!clean(r);}catch{return false;}});}catch{return [];}}

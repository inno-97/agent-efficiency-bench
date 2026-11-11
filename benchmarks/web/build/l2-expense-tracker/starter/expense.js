export const STORAGE_KEY='agent-efficiency-expenses-v1';
export const CATEGORIES=['food','transport','other'];
export function addExpense(rows,input){throw Error('TODO');}
export function updateExpense(rows,id,input){throw Error('TODO');}
export function deleteExpense(rows,id){return rows;}
export function selectExpenses(rows,month,category='all'){return [];}
export function totalExpenses(rows){return 0;}
export function saveExpenses(storage,rows){}
export function loadExpenses(storage){return [];}

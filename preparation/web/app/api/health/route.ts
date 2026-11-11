import {db} from '../../../lib/db';
export const dynamic='force-dynamic';
export async function GET(){try{await db.preparationProbe.count();return Response.json({ok:true,database:'postgresql'});}catch{return Response.json({ok:false},{status:503});}}

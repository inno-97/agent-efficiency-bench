import http from 'node:http';
import {readFile} from 'node:fs/promises';
import {resolve, extname, sep} from 'node:path';
export async function serve(root, port=0) {
  root=resolve(root);
  const server=http.createServer(async(req,res)=>{
    try {
      const pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
      const path=resolve(root,'.'+(pathname==='/'?'/index.html':pathname));
      if (!path.startsWith(root+sep)) { res.writeHead(403).end(); return; }
      const body=await readFile(path);
      const type={'.html':'text/html; charset=utf-8','.js':'text/javascript','.css':'text/css'}[extname(path)]||'application/octet-stream';
      res.writeHead(200,{'Content-Type':type,'Cache-Control':'no-store'}).end(body);
    } catch {res.writeHead(404).end('Not found');}
  });
  await new Promise((ok,fail)=>{server.once('error',fail);server.listen(port,'127.0.0.1',ok);});
  return {url:`http://127.0.0.1:${server.address().port}`,close:()=>new Promise(ok=>server.close(ok))};
}
if (process.argv[1]===new URL(import.meta.url).pathname) {
 const app=await serve(process.argv[2]||'.',Number(process.argv[3]||4173)); console.log(app.url);
}

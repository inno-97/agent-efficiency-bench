import {isolatedApp} from '../evaluation/workspace.mjs';
let app;
try{app=await isolatedApp(new URL('../evaluation/sync-server',import.meta.url).pathname,{port:3418});console.log('Fixed sync server ready at http://127.0.0.1:3418 (Android: http://10.0.2.2:3418). Dedicated temporary schema; Ctrl-C cleans up.');
 for(const signal of ['SIGINT','SIGTERM'])process.once(signal,async()=>{await app.close();process.exit(0)});
}catch(e){console.error(e.message);process.exitCode=2}

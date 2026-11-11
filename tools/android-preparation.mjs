import {execFileSync} from 'node:child_process';
import {join} from 'node:path';
import {fileURLToPath} from 'node:url';
try{
 const serial=process.argv[2];
 if(!/^emulator-\d+$/.test(serial||''))throw Error('Pass a dedicated emulator serial, for example emulator-5580.');
 const sdk=process.env.ANDROID_HOME||process.env.ANDROID_SDK_ROOT;
 if(!sdk)throw Error('Set ANDROID_HOME.');
 const root=fileURLToPath(new URL('../preparation/android/',import.meta.url));
 const adb=join(sdk,'platform-tools',process.platform==='win32'?'adb.exe':'adb');
 const device=(...args)=>execFileSync(adb,['-s',serial,...args],{encoding:'utf8',timeout:180000});
 if(device('shell','getprop','ro.build.version.sdk').trim()!=='35')throw Error('Requires API 35 emulator.');
 execFileSync(process.platform==='win32'?'cmd':'sh',process.platform==='win32'?['/c','gradlew.bat','assembleDebug','assembleDebugAndroidTest']:['gradlew','--console=plain','assembleDebug','assembleDebugAndroidTest'],{cwd:root,stdio:'inherit',timeout:600000});
 device('install','-r','-t',join(root,'app/build/outputs/apk/debug/app-debug.apk'));
 device('install','-r','-t',join(root,'app/build/outputs/apk/androidTest/debug/app-debug-androidTest.apk'));
 const output=device('shell','am','instrument','-w','-r','bench.preparation.test/androidx.test.runner.AndroidJUnitRunner');
 console.log(output);
 if(!/OK \(3 tests\)/.test(output))throw Error('Android preparation tests did not all pass.');
}catch(e){console.error(e.message);process.exitCode=1;}

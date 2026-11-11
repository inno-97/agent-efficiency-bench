package bench.evaluation;
import android.app.*;import android.os.*;import android.content.*;import android.view.*;import android.widget.*;import bench.app.TrackerModel;import java.util.*;import org.json.*;
public final class BenchRunner extends Instrumentation {
 interface Checked {void run() throws Exception;}
 JSONArray results=new JSONArray();int passed=0;Activity activity;boolean probe;
 void eq(Object a,Object b){if(!Objects.equals(a,b))throw new AssertionError("Expected "+b+" got "+a);}
 void yes(boolean ok){if(!ok)throw new AssertionError("Expected true");}
 void rejects(Checked fn)throws Exception{boolean bad=false;try{fn.run();}catch(Exception ex){bad=true;}yes(bad);}
 void test(String name,Checked fn){JSONObject row=new JSONObject();try{row.put("name",name);try{fn.run();row.put("passed",true);passed++;}catch(Throwable e){row.put("passed",false);row.put("error",e.toString());}results.put(row);}catch(Exception e){throw new RuntimeException(e);}finally{close();}}
 void main(Checked fn)throws Exception{Throwable[] err={null};runOnMainSync(()->{try{fn.run();}catch(Throwable e){err[0]=e;}});if(err[0]!=null)throw new Exception(err[0]);waitForIdleSync();}
 void open(boolean clear){if(clear)getTargetContext().getSharedPreferences("tracker",0).edit().clear().commit();Intent i=new Intent();i.setClassName(getTargetContext(),"bench.app.MainActivity");i.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);activity=startActivitySync(i);waitForIdleSync();}
 void close(){if(activity!=null){Activity a=activity;runOnMainSync(a::finish);waitForIdleSync();activity=null;}}
 View v(String tag){View view=activity.getWindow().getDecorView().findViewWithTag(tag);if(view==null)throw new AssertionError("Missing view tag "+tag);return view;}
 void fill(String tag,String text)throws Exception{main(()->((EditText)v(tag)).setText(text));}
 String text(String tag)throws Exception{String[] out={null};main(()->out[0]=((TextView)v(tag)).getText().toString());return out[0];}
 void tap(String tag)throws Exception{main(()->{yes(v(tag).isShown());v(tag).performClick();});}
 String firstId(){LinearLayout rows=(LinearLayout)v("rows");yes(rows.getChildCount()>0);return rows.getChildAt(0).getTag().toString().split(":",2)[1];}
 int count()throws Exception{int[] n={0};main(()->n[0]=((LinearLayout)v("rows")).getChildCount());return n[0];}
 @Override public void onCreate(Bundle arguments){super.onCreate(arguments);probe="true".equals(arguments.getString("probe"));start();}
 @Override public void onStart(){try{if(probe){JSONObject result=new JSONObject();try{probeRestart();result.put("passed",true);}catch(Throwable ex){result.put("passed",false);result.put("error",ex.toString());}finally{close();}Bundle output=new Bundle();output.putString("stream","\nBENCH_PROBE="+result+"\n");finish(Activity.RESULT_OK,output);return;}runTests();prepareRestart();JSONObject report=new JSONObject();report.put("total",results.length());report.put("passed",passed);report.put("results",results);Bundle out=new Bundle();out.putString("stream","\nBENCH_RESULT="+report+"\n");finish(Activity.RESULT_OK,out);}catch(Throwable e){Bundle out=new Bundle();out.putString("stream","BENCH_ERROR="+e);finish(Activity.RESULT_CANCELED,out);}}
 List<TrackerModel.Entry> seed(){return TrackerModel.add(new ArrayList<>(),"Squat","2026-01-01",3,10);}
 void addUI(String title,String day,String sets,String reps)throws Exception{tap("new");fill("title",title);fill("date",day);fill("sets",sets);fill("reps",reps);tap("save");}
void prepareRestart(){List<TrackerModel.Entry> seed=List.of(new TrackerModel.Entry("restart-probe","Restart","2026-01-01",3,10));getTargetContext().getSharedPreferences("tracker",0).edit().putString("state",TrackerModel.write(seed)).commit();}
 void probeRestart()throws Exception{open(false);fill("day","2026-01-01");eq(count(),1);eq(text("summary"),"30");tap("open:restart-probe");eq(text("detail-title"),"Restart");eq(text("detail-volume"),"30");}
 void runTests()throws Exception{
 test("logic/add",()->{List<TrackerModel.Entry> x=new ArrayList<>();List<TrackerModel.Entry> a=TrackerModel.add(x," Squat ","2026-01-01",3,10);eq(x.size(),0);eq(a.get(0).title,"Squat");List<TrackerModel.Entry> b=TrackerModel.add(a,"Squat","2026-01-01",3,10);eq(a.size(),1);yes(!b.get(0).id.equals(b.get(1).id));});
 test("logic/validation",()->{rejects(()->TrackerModel.add(new ArrayList<>()," ","2026-01-01",3,10));rejects(()->TrackerModel.add(new ArrayList<>(),"x".repeat(81),"2026-01-01",3,10));rejects(()->TrackerModel.add(new ArrayList<>(),"A","2026-02-30",3,10));for(int n:new int[]{0,101})rejects(()->TrackerModel.add(new ArrayList<>(),"A","2026-01-01",n,10));for(int n:new int[]{0,1001})rejects(()->TrackerModel.add(new ArrayList<>(),"A","2026-01-01",3,n));});
 test("logic/update",()->{List<TrackerModel.Entry> x=seed();List<TrackerModel.Entry> y=TrackerModel.update(x,x.get(0).id," Changed ","2026-01-02",4,12);eq(x.get(0).sets,3);eq(y.get(0).title,"Changed");eq(y.get(0).sets,4);eq(y.get(0).reps,12);eq(y.get(0).date,"2026-01-02");eq(TrackerModel.update(x,"none","A","2026-01-01",1,1).get(0).id,x.get(0).id);});
 test("logic/delete",()->{List<TrackerModel.Entry> x=seed();eq(TrackerModel.delete(x,x.get(0).id).size(),0);eq(x.size(),1);eq(TrackerModel.delete(x,"none").size(),1);});
 test("logic/date-filter",()->{List<TrackerModel.Entry> x=seed();x=TrackerModel.add(x,"Old","2025-01-01",2,2);eq(TrackerModel.select(x,"2026-01-01").size(),1);eq(TrackerModel.select(x,"2026-01-02").size(),0);});
 test("logic/volume",()->{eq(TrackerModel.volume(new ArrayList<>()),0);eq(TrackerModel.volume(seed()),30);eq(TrackerModel.volume(TrackerModel.add(seed(),"Pushup","2026-01-01",2,15)),60);});
 test("logic/storage-roundtrip",()->{List<TrackerModel.Entry> x=seed(),y=TrackerModel.read(TrackerModel.write(x));eq(y.size(),1);eq(y.get(0).id,x.get(0).id);eq(y.get(0).sets,3);eq(y.get(0).reps,10);eq(y.get(0).date,"2026-01-01");});
 test("logic/storage-recovery",()->{for(String s:new String[]{"{","null","{}","42","[null,{}, {\"id\":1}]"})eq(TrackerModel.read(s).size(),0);});
 test("ui/create-detail-relaunch",()->{open(true);fill("day","2026-01-01");addUI("Squat","2026-01-01","3","10");eq(count(),1);eq(text("summary"),"30");tap("open:"+firstId());eq(text("detail-title"),"Squat");eq(text("detail-volume"),"30");close();open(false);fill("day","2026-01-01");eq(count(),1);eq(text("summary"),"30");});
 test("ui/edit-detail-list",()->{open(true);fill("day","2026-01-01");addUI("Squat","2026-01-01","3","10");tap("open:"+firstId());tap("edit");fill("sets","4");fill("reps","12");tap("save");eq(text("detail-volume"),"48");tap("back");eq(text("summary"),"48");});
 test("ui/edit-date",()->{open(true);fill("day","2026-01-01");addUI("Squat","2026-01-01","3","10");tap("open:"+firstId());tap("edit");fill("date","2026-01-02");tap("save");tap("back");eq(count(),0);eq(text("summary"),"0");fill("day","2026-01-02");eq(count(),1);eq(text("summary"),"30");});
 test("ui/validation-cancel-delete",()->{open(true);fill("day","2026-01-01");addUI(" ","2026-01-01","3","10");yes(!text("error").isEmpty());tap("cancel");eq(count(),0);addUI("Squat","2026-01-01","3","10");tap("open:"+firstId());tap("edit");fill("title","Changed");tap("cancel");tap("open:"+firstId());eq(text("detail-title"),"Squat");tap("delete");eq(count(),0);eq(text("summary"),"0");});
 }

}

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
 void addUI(String name)throws Exception{fill("title",name);tap("add");}
 List<TrackerModel.Entry> seed(){return TrackerModel.add(new ArrayList<>(),"Run");}
void prepareRestart(){Set<String> days=new HashSet<>();days.add("2026-01-01");List<TrackerModel.Entry> seed=List.of(new TrackerModel.Entry("restart-probe","Restart",days));getTargetContext().getSharedPreferences("tracker",0).edit().putString("state",TrackerModel.write(seed)).commit();}
 void probeRestart()throws Exception{open(false);fill("day","2026-01-01");eq(count(),1);eq(text("summary"),"1");main(()->yes(((CheckBox)v("toggle:restart-probe")).isChecked()));}
 void runTests()throws Exception{
 test("logic/add",()->{List<TrackerModel.Entry> x=new ArrayList<>();List<TrackerModel.Entry> a=TrackerModel.add(x," Run ");eq(x.size(),0);eq(a.get(0).title,"Run");List<TrackerModel.Entry> b=TrackerModel.add(a,"Run");eq(a.size(),1);eq(b.size(),2);yes(!b.get(0).id.equals(b.get(1).id));});
 test("logic/validation",()->{rejects(()->TrackerModel.add(new ArrayList<>()," "));rejects(()->TrackerModel.add(new ArrayList<>(),"x".repeat(81)));eq(TrackerModel.add(new ArrayList<>(),"x".repeat(80)).size(),1);});
 test("logic/toggle",()->{List<TrackerModel.Entry> x=seed();String id=x.get(0).id;List<TrackerModel.Entry> a=TrackerModel.toggle(x,id,"2026-01-01");eq(x.get(0).days.size(),0);eq(TrackerModel.completed(a,"2026-01-01"),1);eq(TrackerModel.completed(TrackerModel.toggle(a,id,"2026-01-01"),"2026-01-01"),0);eq(TrackerModel.completed(TrackerModel.toggle(x,"none","2026-01-01"),"2026-01-01"),0);});
 test("logic/date-isolation",()->{List<TrackerModel.Entry> x=seed();List<TrackerModel.Entry> a=TrackerModel.toggle(x,x.get(0).id,"2026-01-01");eq(TrackerModel.completed(a,"2026-01-02"),0);eq(TrackerModel.completed(a,"2026-01-01"),1);rejects(()->TrackerModel.toggle(x,x.get(0).id,"2026-02-30"));});
 test("logic/delete",()->{List<TrackerModel.Entry> x=seed();eq(TrackerModel.delete(x,x.get(0).id).size(),0);eq(x.size(),1);eq(TrackerModel.delete(x,"none").size(),1);});
 test("logic/storage-roundtrip",()->{List<TrackerModel.Entry> x=seed();x=TrackerModel.toggle(x,x.get(0).id,"2026-01-01");List<TrackerModel.Entry> y=TrackerModel.read(TrackerModel.write(x));eq(y.size(),1);eq(y.get(0).id,x.get(0).id);eq(TrackerModel.completed(y,"2026-01-01"),1);});
 test("logic/corrupt-storage",()->{for(String s:new String[]{"{","null","{}","42"})eq(TrackerModel.read(s).size(),0);});
 test("logic/storage-validation",()->{eq(TrackerModel.read("[null,{}, {\"id\":\"x\",\"title\":\" \",\"days\":[]},{\"id\":\"y\",\"title\":\"A\",\"days\":[\"2026-02-30\"]}]").size(),0);});
 test("ui/add-toggle",()->{open(true);fill("day","2026-01-01");addUI("Run");eq(count(),1);String id=firstId();tap("toggle:"+id);eq(text("summary"),"1");});
 test("ui/relaunch-persistence",()->{open(true);fill("day","2026-01-01");addUI("Run");String id=firstId();tap("toggle:"+id);close();open(false);fill("day","2026-01-01");eq(count(),1);eq(text("summary"),"1");main(()->yes(((CheckBox)v("toggle:"+id)).isChecked()));});
 test("ui/date-switch",()->{open(true);fill("day","2026-01-01");addUI("Run");tap("toggle:"+firstId());fill("day","2026-01-02");eq(text("summary"),"0");fill("day","2026-01-01");eq(text("summary"),"1");});
 test("ui/delete-validation",()->{open(true);addUI(" ");eq(count(),0);yes(!text("error").isEmpty());addUI("<b>Run</b>");eq(count(),1);tap("delete:"+firstId());eq(count(),0);close();open(false);eq(count(),0);});
 }

}

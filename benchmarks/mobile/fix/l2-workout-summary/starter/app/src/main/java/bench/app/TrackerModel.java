package bench.app;
import java.util.*;
import java.time.LocalDate;
import org.json.*;
public final class TrackerModel {
 public static final class Entry {
  public final String id,title,date;public final int sets,reps;
  public Entry(String id,String title,String date,int sets,int reps){this.id=id;this.title=title;this.date=date;this.sets=sets;this.reps=reps;}
 }
 static String title(String value){String s=value.trim();if(s.isEmpty()||s.length()>80)throw new IllegalArgumentException("제목은 1~80자");return s;}
 static void validate(String name,String day,int sets,int reps){title(name);if(!day.matches("\\d{4}-\\d{2}-\\d{2}")||!LocalDate.parse(day).toString().equals(day))throw new IllegalArgumentException("날짜 오류");if(sets<1||sets>100||reps<1||reps>1000)throw new IllegalArgumentException("세트 1~100 / 횟수 1~1000");}
 public static List<Entry> add(List<Entry> rows,String name,String day,int sets,int reps){validate(name,day,sets,reps);List<Entry> next=new ArrayList<>(rows);next.add(new Entry(UUID.randomUUID().toString(),title(name),day,sets,reps));return next;}
 public static List<Entry> update(List<Entry> rows,String id,String name,String day,int sets,int reps){validate(name,day,sets,reps);List<Entry> next=new ArrayList<>();for(Entry e:rows)next.add(e.id.equals(id)?new Entry(id,title(name),day,e.sets,e.reps):e);return next;}
 public static List<Entry> delete(List<Entry> rows,String id){List<Entry> next=new ArrayList<>();for(Entry e:rows)if(!e.id.equals(id))next.add(e);return next;}
 public static List<Entry> select(List<Entry> rows,String day){List<Entry> next=new ArrayList<>();for(Entry e:rows)if(e.date.equals(day))next.add(e);return next;}
 public static int volume(List<Entry> rows){int n=0;for(Entry e:rows)n+=e.sets+e.reps;return n;}
 public static String write(List<Entry> rows){JSONArray out=new JSONArray();try{for(Entry e:rows){JSONObject o=new JSONObject();o.put("id",e.id);o.put("title",e.title);o.put("date",e.date);o.put("sets",e.sets);o.put("reps",e.reps);out.put(o);}}catch(JSONException ex){throw new IllegalArgumentException(ex);}return out.toString();}
 public static List<Entry> read(String raw){List<Entry> rows=new ArrayList<>();try{JSONArray data=new JSONArray(raw);for(int i=0;i<data.length();i++){try{JSONObject o=data.getJSONObject(i);if(!(o.get("id") instanceof String)||!(o.get("title") instanceof String)||!(o.get("date") instanceof String)||!(o.get("sets") instanceof Integer)||!(o.get("reps") instanceof Integer))continue;String id=o.getString("id"),name=o.getString("title"),day=o.getString("date");int sets=o.getInt("sets"),reps=o.getInt("reps");validate(name,day,sets,reps);if(!id.isEmpty())rows.add(new Entry(id,title(name),day,sets,reps));}catch(Exception ignored){}}}catch(Exception ignored){}return rows;}
}

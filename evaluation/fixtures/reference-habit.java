package bench.app;
import java.util.*;
import java.time.LocalDate;
import org.json.*;
public final class TrackerModel {
 public static final class Entry {
  public final String id,title; public final Set<String> days;
  public Entry(String id,String title,Set<String> days){this.id=id;this.title=title;this.days=new HashSet<>(days);}
 }
 static String title(String value){String s=value.trim();if(s.isEmpty()||s.length()>80)throw new IllegalArgumentException("제목은 1~80자");return s;}
 static void date(String day){if(!day.matches("\\d{4}-\\d{2}-\\d{2}"))throw new IllegalArgumentException("날짜 오류");if(!LocalDate.parse(day).toString().equals(day))throw new IllegalArgumentException("날짜 오류");}
 public static List<Entry> add(List<Entry> rows,String name){List<Entry> next=new ArrayList<>(rows);next.add(new Entry(UUID.randomUUID().toString(),title(name),Collections.emptySet()));return next;}
 public static List<Entry> toggle(List<Entry> rows,String id,String day){date(day);List<Entry> next=new ArrayList<>();for(Entry e:rows){Set<String> days=new HashSet<>(e.days);if(e.id.equals(id)){if(!days.add(day))days.remove(day);}next.add(new Entry(e.id,e.title,days));}return next;}
 public static List<Entry> delete(List<Entry> rows,String id){List<Entry> next=new ArrayList<>();for(Entry e:rows)if(!e.id.equals(id))next.add(e);return next;}
 public static int completed(List<Entry> rows,String day){date(day);int n=0;for(Entry e:rows)if(e.days.contains(day))n++;return n;}
 public static String write(List<Entry> rows){JSONArray out=new JSONArray();try{for(Entry e:rows){JSONObject o=new JSONObject();o.put("id",e.id);o.put("title",e.title);o.put("days",new JSONArray(new TreeSet<>(e.days)));out.put(o);}}catch(JSONException ex){throw new IllegalArgumentException(ex);}return out.toString();}
 public static List<Entry> read(String raw){List<Entry> rows=new ArrayList<>();try{JSONArray data=new JSONArray(raw);for(int i=0;i<data.length();i++){try{JSONObject o=data.getJSONObject(i);if(!(o.get("id") instanceof String)||!(o.get("title") instanceof String))continue;String id=o.getString("id"),name=title(o.getString("title"));if(id.isEmpty())continue;JSONArray dates=o.getJSONArray("days");Set<String> days=new HashSet<>();for(int j=0;j<dates.length();j++){if(!(dates.get(j) instanceof String))throw new IllegalArgumentException();String d=dates.getString(j);date(d);days.add(d);}rows.add(new Entry(id,name,days));}catch(Exception ignored){}}}catch(Exception ignored){}return rows;}
}

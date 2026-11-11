package bench.app;
import android.app.Activity;import android.os.Bundle;import android.widget.*;import java.util.*;import java.time.LocalDate;
public class MainActivity extends Activity {
 List<TrackerModel.Entry> entries;LinearLayout root,rows;EditText title,day;TextView summary,error;
 @Override public void onCreate(Bundle b){super.onCreate(b);entries=TrackerModel.read(getSharedPreferences("tracker",0).getString("state","[]"));root=new LinearLayout(this);root.setOrientation(1);root.setPadding(24,48,24,24);setContentView(root);
 title=input("title","습관 이름");day=input("day","YYYY-MM-DD");day.setText(LocalDate.now().toString());Button add=button("add","추가");error=text("error");summary=text("summary");ScrollView scroll=new ScrollView(this);rows=new LinearLayout(this);rows.setOrientation(1);rows.setTag("rows");scroll.addView(rows);root.addView(scroll);
 add.setOnClickListener(v->{try{entries=TrackerModel.add(entries,title.getText().toString());title.setText("");persist();error.setText("");render();}catch(Exception e){error.setText("입력 오류");}});
 day.addTextChangedListener(new android.text.TextWatcher(){public void beforeTextChanged(CharSequence s,int a,int c,int f){}public void onTextChanged(CharSequence s,int a,int b,int c){render();}public void afterTextChanged(android.text.Editable e){}});render();}
 EditText input(String tag,String hint){EditText v=new EditText(this);v.setTag(tag);v.setHint(hint);v.setSingleLine(true);root.addView(v);return v;}
 TextView text(String tag){TextView v=new TextView(this);v.setTag(tag);root.addView(v);return v;}
 Button button(String tag,String label){Button v=new Button(this);v.setTag(tag);v.setText(label);root.addView(v);return v;}
 void persist(){getSharedPreferences("tracker",0).edit().putString("state",TrackerModel.write(entries)).commit();}
 void render(){if(rows==null)return;String d=day.getText().toString();rows.removeAllViews();try{summary.setText(String.valueOf(TrackerModel.completed(entries,d)));for(TrackerModel.Entry e:entries){LinearLayout row=new LinearLayout(this);row.setTag("row:"+e.id);CheckBox c=new CheckBox(this);c.setTag("toggle:"+e.id);c.setText(e.title);c.setChecked(e.days.contains(d));c.setOnClickListener(v->{entries=TrackerModel.toggle(entries,e.id,d);persist();render();});Button del=new Button(this);del.setText("삭제");del.setTag("delete:"+e.id);del.setOnClickListener(v->{entries=TrackerModel.delete(entries,e.id);persist();render();});row.addView(c);row.addView(del);rows.addView(row);}}catch(Exception ex){summary.setText("날짜 오류");}}
}

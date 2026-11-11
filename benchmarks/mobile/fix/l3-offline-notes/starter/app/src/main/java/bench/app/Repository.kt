package bench.app
import android.content.Context
import androidx.room.*
import java.io.File
import java.io.InputStream
import java.util.UUID
@Entity data class Note(@PrimaryKey val id:String,val title:String,val body:String,val tags:String,val photo:String?=null)
@Dao interface NoteDao {
 @Query("SELECT * FROM Note ORDER BY title,id") suspend fun all():List<Note>
 @Query("SELECT * FROM Note WHERE id=:id") suspend fun find(id:String):Note?
 @Insert(onConflict=OnConflictStrategy.REPLACE) suspend fun put(note:Note)
 @Query("DELETE FROM Note WHERE id=:id") suspend fun remove(id:String)
}
@Database(entities=[Note::class],version=1,exportSchema=false)
abstract class NoteDatabase:RoomDatabase(){abstract fun notes():NoteDao}
class NoteRepository(val context:Context,name:String="notes.db") {
 val db=Room.databaseBuilder(context,NoteDatabase::class.java,name).build()
 private val photos=File(context.filesDir,"note-photos").apply{mkdirs()}
 private fun clean(title:String,body:String,tags:String):Triple<String,String,String>{
  require(title.trim().isNotEmpty()&&title.trim().length<=120);require(body.length<=5000)
  val values=tags.split(',').map{it.trim()}.filter{it.isNotEmpty()}.distinct();require(values.size<=5&&values.all{it.length<=30})
  return Triple(title.trim(),body,values.sorted().joinToString(","))
 }
 suspend fun save(id:String?,title:String,body:String,tags:String):Note{
  val (t,b,g)=clean(title,body,tags);val old:Note?=null
  val note=Note(id?:UUID.randomUUID().toString(),t,b,g,old?.photo);db.notes().put(note);return note
 }
 suspend fun list(query:String="",tag:String=""):List<Note> = db.notes().all().filter{(it.title.contains(query,true)||it.body.contains(query,true))&&(tag.isEmpty()||it.tags.split(',').contains(tag))}
 suspend fun delete(id:String){val note=db.notes().find(id)?:return;db.notes().remove(id);note.photo?.let{safeFile(it)?.delete()}}
 private fun safeFile(path:String):File?{val f=File(path);return if(f.canonicalFile.parentFile==photos.canonicalFile)f else null}
 suspend fun attach(id:String,source:(()->InputStream?)?):Note{
  val note=db.notes().find(id)?:throw IllegalArgumentException("missing note");if(source==null)return note
  val temp=File(photos,"tmp-"+UUID.randomUUID());val dest=File(photos,UUID.randomUUID().toString()+".image")
  try{val input=source()?:throw IllegalArgumentException("unreadable photo");input.use{stream->temp.outputStream().use{out->val buf=ByteArray(8192);var size=0;while(true){val n=stream.read(buf);if(n<0)break;size+=n;require(size<=5*1024*1024){"photo too large"};out.write(buf,0,n)}}};require(temp.length()>0);check(temp.renameTo(dest));val next=note.copy(photo=dest.absolutePath);db.notes().put(next);note.photo?.let{safeFile(it)?.delete()};return next}catch(e:Exception){temp.delete();dest.delete();throw e}
 }
 suspend fun removePhoto(id:String):Note{val note=db.notes().find(id)?:throw IllegalArgumentException("missing note");val next=note.copy(photo=null);return next}
 fun close(){db.close()}
}

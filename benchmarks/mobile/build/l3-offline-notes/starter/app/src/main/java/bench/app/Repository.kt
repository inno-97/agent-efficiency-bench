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
 suspend fun save(id:String?,title:String,body:String,tags:String):Note=throw IllegalStateException("TODO save")
 suspend fun list(query:String="",tag:String=""):List<Note> = emptyList()
 suspend fun delete(id:String){throw IllegalStateException("TODO delete")}
 suspend fun attach(id:String,source:(()->InputStream?)?):Note=throw IllegalStateException("TODO attach")
 suspend fun removePhoto(id:String):Note=throw IllegalStateException("TODO removePhoto")
 fun close(){db.close()}
}

package bench.app
import android.content.Context
import androidx.room.*
import androidx.work.*
import kotlinx.coroutines.sync.Mutex
import kotlinx.coroutines.sync.withLock
import okhttp3.*
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.RequestBody.Companion.toRequestBody
import org.json.JSONObject
import org.json.JSONArray
import retrofit2.Retrofit
import retrofit2.Call
import retrofit2.http.POST
import retrofit2.http.GET
import retrofit2.http.Body
import retrofit2.http.Header
import java.util.UUID
@Entity data class Entry(@PrimaryKey val id:String,val title:String,val completed:Boolean=false,val version:Int=0,val deleted:Boolean=false,val dirty:Boolean=true,val operationId:String=UUID.randomUUID().toString(),val conflict:Boolean=false)
@Dao interface EntryDao {
 @Query("SELECT * FROM Entry ORDER BY id") suspend fun all():List<Entry>
 @Query("SELECT * FROM Entry WHERE id=:id") suspend fun find(id:String):Entry?
 @Insert(onConflict=OnConflictStrategy.REPLACE) suspend fun put(entry:Entry)
}
@Database(entities=[Entry::class],version=1,exportSchema=false)
abstract class EntryDatabase:RoomDatabase(){abstract fun entries():EntryDao}
interface SyncApi {
 @POST("api/login") fun login(@Body body:RequestBody):Call<ResponseBody>
 @GET("api/items") fun items(@Header("Cookie") cookie:String):Call<ResponseBody>
 @POST("api/sync") fun push(@Header("Cookie") cookie:String,@Body body:RequestBody):Call<ResponseBody>
}
fun requestBody(value:JSONObject)=value.toString().toRequestBody("application/json".toMediaType())
private val repositoryLocks=java.util.concurrent.ConcurrentHashMap<String,Mutex>()
class SyncRepository(val context:Context,val name:String="sync.db",val baseUrl:String="http://10.0.2.2:3418/"){
 val db=Room.databaseBuilder(context,EntryDatabase::class.java,name).build()
 private val prefs=context.getSharedPreferences("session-"+name,Context.MODE_PRIVATE)
 private val api=Retrofit.Builder().baseUrl(baseUrl).client(OkHttpClient.Builder().connectTimeout(3,java.util.concurrent.TimeUnit.SECONDS).readTimeout(5,java.util.concurrent.TimeUnit.SECONDS).build()).build().create(SyncApi::class.java)
 private val lock=repositoryLocks.getOrPut(context.getDatabasePath(name).absolutePath){Mutex()}
 fun signedIn()=prefs.getString("cookie",null)!=null
 fun login(email:String,password:String){val response=api.login(requestBody(JSONObject().put("email",email).put("password",password))).execute();response.body()?.close();check(response.isSuccessful){"login failed"};val owner=email.lowercase();val previous=prefs.getString("owner",null);require(previous==null||previous==owner){"one account per local database"};prefs.edit().putString("owner",owner).putString("cookie",response.headers()["Set-Cookie"]?.substringBefore(';')).commit()}
 suspend fun save(id:String?,title:String,completed:Boolean=false):Entry=lock.withLock{
  require(title.trim().isNotEmpty()&&title.trim().length<=120)
  val old=id?.let{db.entries().find(it)?:throw IllegalArgumentException("missing item")}
  val value=Entry(id?:UUID.randomUUID().toString(),title.trim(),completed,old?.version?:0,false,true,UUID.randomUUID().toString(),false);db.entries().put(value);value
 }
 suspend fun delete(id:String)=lock.withLock{val old=db.entries().find(id)?:return@withLock;db.entries().put(old.copy(deleted=true,dirty=false,operationId=UUID.randomUUID().toString(),conflict=false))}
 suspend fun list()=db.entries().all().filter{!it.deleted}
 private fun remote(v:JSONObject,conflict:Boolean=false)=Entry(v.getString("id"),v.getString("title"),v.getBoolean("completed"),v.getInt("version"),v.getBoolean("deleted"),false,"",conflict)
 suspend fun sync():Boolean=lock.withLock{
  val cookie=prefs.getString("cookie",null)?:return@withLock false
  try{
   for(item in db.entries().all().filter{it.dirty}){
    val payload=JSONObject().put("operationId",item.operationId).put("id",item.id).put("baseVersion",item.version).put("title",item.title).put("completed",item.completed).put("deleted",item.deleted)
    val response=api.push(cookie,requestBody(payload)).execute();val text=(response.body()?:response.errorBody())?.use{it.string()}?:"{}"
    if(!response.isSuccessful)return@withLock false
    val data=JSONObject(text);if(!data.has("item"))return@withLock false
    db.entries().put(remote(data.getJSONObject("item"),response.code()==409))
   }
   val response=api.items(cookie).execute();if(!response.isSuccessful){response.errorBody()?.close();return@withLock false}
   val array=JSONArray(response.body()!!.use{it.string()});for(i in 0 until array.length()){val value=remote(array.getJSONObject(i));val old=db.entries().find(value.id);if(old==null||!old.dirty)db.entries().put(value.copy(conflict=old?.conflict?:false))}
   true
  }catch(e:Exception){false}
 }
 fun enqueue(){val request=OneTimeWorkRequestBuilder<SyncWorker>().setConstraints(Constraints.Builder().setRequiredNetworkType(NetworkType.CONNECTED).build()).setBackoffCriteria(BackoffPolicy.EXPONENTIAL,10,java.util.concurrent.TimeUnit.SECONDS).build();WorkManager.getInstance(context).enqueueUniqueWork("checklist-sync",ExistingWorkPolicy.KEEP,request)}
 fun close(){db.close()}
}
class SyncWorker(context:Context,params:WorkerParameters):CoroutineWorker(context,params){override suspend fun doWork():Result{val repo=SyncRepository(applicationContext);return try{if(repo.sync())Result.success() else Result.retry()}finally{repo.close()}}}

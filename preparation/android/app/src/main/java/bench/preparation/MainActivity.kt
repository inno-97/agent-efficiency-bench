package bench.preparation
import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.lifecycle.ViewModel
import androidx.room.*
import androidx.work.CoroutineWorker
import androidx.work.WorkerParameters
import android.content.Context
import retrofit2.Retrofit
import okhttp3.OkHttpClient

@Entity data class Probe(@PrimaryKey val id:String,val message:String)
@Dao interface ProbeDao {
 @Insert suspend fun insert(probe:Probe)
 @Query("SELECT * FROM Probe WHERE id=:id") suspend fun find(id:String):Probe?
}
@Database(entities=[Probe::class],version=1,exportSchema=false)
abstract class ProbeDatabase:RoomDatabase(){abstract fun probes():ProbeDao}
class PreparationViewModel:ViewModel()
class PreparationWorker(context:Context,params:WorkerParameters):CoroutineWorker(context,params){override suspend fun doWork()=Result.success()}
interface PreparationApi { @retrofit2.http.GET("api/health") fun health():retrofit2.Call<okhttp3.ResponseBody> }
fun httpClient():Retrofit=Retrofit.Builder().baseUrl("http://10.0.2.2:3417/").client(OkHttpClient()).build()
class MainActivity:ComponentActivity(){override fun onCreate(state:Bundle?){super.onCreate(state);setContent {MaterialTheme{Text("Preparation ready")}}}}

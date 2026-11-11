package bench.preparation
import androidx.compose.ui.test.junit4.createAndroidComposeRule
import androidx.compose.ui.test.onNodeWithText
import androidx.compose.ui.test.assertIsDisplayed
import androidx.room.Room
import androidx.test.platform.app.InstrumentationRegistry
import kotlinx.coroutines.runBlocking
import org.junit.Rule
import org.junit.Test
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
class PreparationTest {
 @get:Rule val compose=createAndroidComposeRule<MainActivity>()
 @Test fun nativeUi(){compose.onNodeWithText("Preparation ready").assertIsDisplayed()}
 @Test fun roomRoundtrip()=runBlocking{
  val context=InstrumentationRegistry.getInstrumentation().targetContext
  val db=Room.inMemoryDatabaseBuilder(context,ProbeDatabase::class.java).build()
  try{db.probes().insert(Probe("probe","ready"));assertEquals("ready",db.probes().find("probe")?.message)}finally{db.close()}
 }
 @Test fun networkClient(){val response=httpClient().create(PreparationApi::class.java).health().execute();assertEquals(200,response.code());val body=response.body();try{assertTrue(body!!.string().contains("\"ok\":true"))}finally{body?.close()}}
}

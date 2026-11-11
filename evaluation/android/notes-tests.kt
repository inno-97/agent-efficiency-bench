package bench.app
import android.content.Context
import androidx.compose.ui.test.*
import androidx.compose.ui.test.junit4.createAndroidComposeRule
import androidx.test.platform.app.InstrumentationRegistry
import kotlinx.coroutines.runBlocking
import org.junit.Rule
import org.junit.Test
import org.junit.Assert.*
import org.json.JSONObject
import org.json.JSONArray
import java.io.File
import java.io.ByteArrayInputStream
import java.util.UUID
class BenchTest {
 @get:Rule val compose=createAndroidComposeRule<MainActivity>()
 val context:Context get()=InstrumentationRegistry.getInstrumentation().targetContext
 val results=JSONArray()
 suspend fun check(name:String,block:suspend()->Unit){try{block();results.put(JSONObject().put("name",name).put("passed",true))}catch(e:Throwable){results.put(JSONObject().put("name",name).put("passed",false).put("error",e.toString()+" at "+e.stackTrace.firstOrNull{it.className=="bench.app.BenchTest"}))}}
 suspend fun invalid(block:suspend()->Unit){var threw=false;try{block()}catch(e:Exception){threw=true};assertTrue("Expected input rejection",threw)}
 fun report(){var passed=0;for(i in 0 until results.length())if(results.getJSONObject(i).getBoolean("passed"))passed++;File(context.filesDir,"bench-report.json").writeText(JSONObject().put("total",results.length()).put("passed",passed).put("results",results).toString())}
 @Test fun contract()=runBlocking{
 val phase=InstrumentationRegistry.getArguments().getString("phase")?:"main"
  if(phase!="main"){
 check("process/restart-photo-persistence"){
 val repo=NoteRepository(context,"probe-notes.db")
 try{if(phase=="seed"){val n=repo.save(null,"Persistent","body","one");repo.attach(n.id){ByteArrayInputStream(byteArrayOf(1,2,3,4))}}else{val n=repo.list().single();assertEquals("Persistent",n.title);assertArrayEquals(byteArrayOf(1,2,3,4),File(n.photo!!).readBytes())}}finally{repo.close()}
 };report();return@runBlocking
 }
 suspend fun withRepo(block:suspend(NoteRepository)->Unit){val name="notes-"+UUID.randomUUID()+".db";val repo=NoteRepository(context,name);try{block(repo)}finally{repo.close();context.deleteDatabase(name)}}
 check("notes/crud-stable-id"){withRepo{r->val a=r.save(null,"  Zebra  ","body","b,a,b");val b=r.save(null,"Alpha","","a");assertNotEquals(a.id,b.id);assertEquals("Zebra",a.title);assertEquals("a,b",a.tags);assertEquals(listOf("Alpha","Zebra"),r.list().map{it.title});val edited=r.save(a.id,"Updated","new","c");assertEquals(a.id,edited.id);assertEquals("new",r.db.notes().find(a.id)!!.body);r.delete(b.id);assertEquals(1,r.list().size);r.delete("missing")}}
 check("notes/validation-atomic"){withRepo{r->val n=r.save(null,"Valid","body","tag");for(t in listOf(" ","x".repeat(121)))invalid{r.save(n.id,t,"","")};invalid{r.save(n.id,"x","x".repeat(5001),"")};invalid{r.save(n.id,"x","","a,b,c,d,e,f")};invalid{r.save(n.id,"x","","x".repeat(31))};invalid{r.save("missing","x","","")};assertEquals(n,r.db.notes().find(n.id))}}
 check("notes/search-tag-combined"){withRepo{r->r.save(null,"Alpha","CONTENT","one,two");r.save(null,"Beta","content","ones");assertEquals(2,r.list("content").size);assertEquals(1,r.list("ALPHA","one").size);assertEquals(0,r.list("beta","one").size)}}
 check("notes/room-reopen"){val name="reopen-"+UUID.randomUUID()+".db";val r=NoteRepository(context,name);val n=r.save(null,"Saved","body","tag");r.close();val other=NoteRepository(context,name);try{assertEquals(n,other.list().single())}finally{other.close();context.deleteDatabase(name)}}
 check("photo/copy-retains-bytes"){withRepo{r->val n=r.save(null,"Photo","","");val source=File(context.cacheDir,"source").apply{writeBytes(byteArrayOf(1,4,9))};val a=r.attach(n.id){source.inputStream()};source.delete();assertTrue(File(a.photo!!).canonicalPath.startsWith(File(context.filesDir,"note-photos").canonicalPath+"/"));assertArrayEquals(byteArrayOf(1,4,9),File(a.photo).readBytes())}}
 check("photo/cancel-preserves"){withRepo{r->val n=r.save(null,"Photo","","");val a=r.attach(n.id){ByteArrayInputStream(byteArrayOf(7))};assertEquals(a,r.attach(n.id,null));assertTrue(File(a.photo!!).exists())}}
 check("photo/edit-preserves-attachment"){withRepo{r->val n=r.save(null,"Photo","","");val a=r.attach(n.id){ByteArrayInputStream(byteArrayOf(7))};assertEquals(a.photo,r.save(n.id,"Edited","","tag").photo)}}
 check("photo/replace-cleans-old"){withRepo{r->val n=r.save(null,"Photo","","");val a=r.attach(n.id){ByteArrayInputStream(byteArrayOf(7))};val b=r.attach(n.id){ByteArrayInputStream(byteArrayOf(8))};assertFalse(File(a.photo!!).exists());assertArrayEquals(byteArrayOf(8),File(b.photo!!).readBytes())}}
 check("photo/failure-atomic"){withRepo{r->val n=r.save(null,"Photo","","");val a=r.attach(n.id){ByteArrayInputStream(byteArrayOf(7))};val before=File(context.filesDir,"note-photos").list()!!.toSet();invalid{r.attach(n.id){null}};invalid{r.attach(n.id){throw SecurityException("revoked URI")}};invalid{r.attach(n.id){object:java.io.InputStream(){override fun read():Int=throw java.io.IOException("copy failed")}}};assertEquals(a,r.db.notes().find(n.id));assertTrue(File(a.photo!!).exists());assertEquals(before,File(context.filesDir,"note-photos").list()!!.toSet())}}
 check("photo/empty-oversize"){withRepo{r->val n=r.save(null,"Photo","","");invalid{r.attach(n.id){ByteArrayInputStream(byteArrayOf())}};invalid{r.attach(n.id){ByteArrayInputStream(ByteArray(5*1024*1024+1))}};assertNull(r.db.notes().find(n.id)!!.photo)}}
 check("photo/remove-persists-cleans"){withRepo{r->val n=r.save(null,"Photo","","");val a=r.attach(n.id){ByteArrayInputStream(byteArrayOf(7))};r.removePhoto(n.id);assertNull(r.db.notes().find(n.id)!!.photo);assertFalse(File(a.photo!!).exists())}}
 check("photo/delete-cleans"){withRepo{r->val n=r.save(null,"Photo","","");val a=r.attach(n.id){ByteArrayInputStream(byteArrayOf(7))};r.delete(n.id);assertNull(r.db.notes().find(n.id));assertFalse(File(a.photo!!).exists())}}
 check("ui/create-edit-recreate"){
 compose.onNodeWithTag("new").performClick();compose.onNodeWithTag("title").performTextInput("UI note");compose.onNodeWithTag("body").performTextInput("Details");compose.onNodeWithTag("tags").performTextInput("one,two");compose.onNodeWithTag("save").performClick();compose.waitUntil(5000){compose.onAllNodesWithTag("new").fetchSemanticsNodes().isNotEmpty()};compose.waitUntil(5000){compose.onAllNodesWithText("UI note").fetchSemanticsNodes().isNotEmpty()};compose.onNodeWithText("UI note").performClick();compose.waitUntil(5000){compose.onAllNodesWithTag("edit").fetchSemanticsNodes().isNotEmpty()};compose.onNodeWithTag("edit").performClick();compose.onNodeWithTag("title").performTextReplacement("UI edited");compose.onNodeWithTag("save").performClick();compose.waitUntil(5000){compose.onAllNodesWithTag("new").fetchSemanticsNodes().isNotEmpty()};compose.waitUntil(5000){compose.onAllNodesWithText("UI edited").fetchSemanticsNodes().isNotEmpty()};compose.activityRule.scenario.recreate();compose.onNodeWithText("UI edited").assertIsDisplayed()
 }
 check("ui/search"){compose.onNodeWithTag("query").performTextReplacement("absent");compose.waitUntil(5000){compose.onAllNodesWithText("UI edited").fetchSemanticsNodes().isEmpty()};compose.onNodeWithTag("query").performTextClearance();compose.waitUntil(5000){compose.onAllNodesWithText("UI edited").fetchSemanticsNodes().isNotEmpty()}}
 check("ui/picker-cancel"){compose.onNodeWithText("UI edited").performClick();compose.onNodeWithTag("attach").performScrollTo().performClick();Thread.sleep(1000);InstrumentationRegistry.getInstrumentation().uiAutomation.performGlobalAction(android.accessibilityservice.AccessibilityService.GLOBAL_ACTION_BACK);compose.waitForIdle();compose.onNodeWithTag("photo-state").assertTextEquals("No photo")}
 check("ui/delete"){compose.onNodeWithTag("delete").performScrollTo().performClick();compose.waitUntil(5000){compose.onAllNodesWithText("UI edited").fetchSemanticsNodes().isEmpty()}}

 report()
 }
}

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
 if(phase.startsWith("cross-")){
 check("sync/two-emulator-propagation"){
 val repo=SyncRepository(context,"cross-device.db");val marker=InstrumentationRegistry.getArguments().getString("marker")!!
 try{repo.login("alice@example.test","benchmark-password")
 when(phase){
 "cross-seed"->{repo.save(null,marker);assertTrue(repo.sync())}
 "cross-peer"->{assertTrue(repo.sync());val n=repo.list().single{it.title==marker};repo.save(n.id,marker+" peer",true);assertTrue(repo.sync())}
 "cross-verify"->{val n=repo.list().single{it.title==marker};assertTrue(repo.sync());val remote=repo.db.entries().find(n.id)!!;assertEquals(marker+" peer",remote.title);assertEquals(2,remote.version);assertTrue(remote.completed)}
 }
 }finally{repo.close()}
 };report();return@runBlocking
 }
 if(phase!="main"){
 check("process/restart-pending-and-session"){
 val repo=SyncRepository(context,"probe-sync.db");try{if(phase=="seed"){repo.login("alice@example.test","benchmark-password");repo.save(null,"Persistent pending")}else{assertTrue(repo.signedIn());val n=repo.list().single();assertEquals("Persistent pending",n.title);assertTrue(n.dirty);assertTrue(n.operationId.isNotEmpty())}}finally{repo.close()}
 };report();return@runBlocking
 }
 val uiTitle="UI-"+UUID.randomUUID().toString();val uiEdited=uiTitle+"-edited"
 suspend fun withRepo(block:suspend(SyncRepository)->Unit){val name="sync-"+UUID.randomUUID()+".db";val r=SyncRepository(context,name);try{r.login("alice@example.test","benchmark-password");block(r)}finally{r.close();context.deleteDatabase(name)}}
 check("offline/crud-validation"){withRepo{r->val n=r.save(null,"  Item  ");assertEquals("Item",n.title);assertEquals(0,n.version);assertTrue(n.dirty);invalid{r.save(n.id," ")};invalid{r.save(n.id,"x".repeat(121))};invalid{r.save("missing","x")};val edited=r.save(n.id,"Edited",true);assertEquals(n.id,edited.id);assertNotEquals(n.operationId,edited.operationId);assertTrue(edited.completed);r.delete(n.id);assertTrue(r.list().isEmpty());assertTrue(r.db.entries().find(n.id)!!.dirty);assertTrue(r.db.entries().find(n.id)!!.deleted)}}
 check("auth/reject-switch"){withRepo{r->invalid{r.login("bob@example.test","benchmark-password")}}}
 check("sync/create-ack-version"){withRepo{r->val n=r.save(null,"Created");assertTrue(r.sync());val saved=r.db.entries().find(n.id)!!;assertEquals(1,saved.version);assertFalse(saved.dirty)}}
 check("sync/two-client-pull-update"){withRepo{a->withRepo{b->val n=a.save(null,"Two clients");assertTrue(a.sync());assertTrue(b.sync());assertEquals("Two clients",b.db.entries().find(n.id)!!.title);b.save(n.id,"Remote edit",true);assertTrue(b.sync());assertTrue(a.sync());val local=a.db.entries().find(n.id)!!;assertEquals("Remote edit",local.title);assertTrue(local.completed);assertEquals(2,local.version)}}}
 check("sync/conflict-server-wins"){withRepo{a->withRepo{b->val n=a.save(null,"Conflict");assertTrue(a.sync());assertTrue(b.sync());a.save(n.id,"Winner");assertTrue(a.sync());b.save(n.id,"Loser");assertTrue(b.sync());val local=b.db.entries().find(n.id)!!;assertEquals("Winner",local.title);assertTrue(local.conflict);assertFalse(local.dirty);assertTrue(b.sync());assertTrue(b.db.entries().find(n.id)!!.conflict);b.save(n.id,"Resolved");assertFalse(b.db.entries().find(n.id)!!.conflict)}}}
 check("sync/delete-tombstone-propagates"){withRepo{a->withRepo{b->val n=a.save(null,"Delete");assertTrue(a.sync());assertTrue(b.sync());a.delete(n.id);assertTrue(a.sync());assertTrue(b.sync());assertTrue(b.db.entries().find(n.id)!!.deleted);assertFalse(b.list().any{it.id==n.id});assertEquals(2,b.db.entries().find(n.id)!!.version)}}}
 check("sync/stale-edit-cannot-resurrect"){withRepo{a->withRepo{b->val n=a.save(null,"Gone");assertTrue(a.sync());assertTrue(b.sync());a.delete(n.id);assertTrue(a.sync());b.save(n.id,"Resurrect");assertTrue(b.sync());assertTrue(b.db.entries().find(n.id)!!.deleted);assertTrue(b.db.entries().find(n.id)!!.conflict)}}}
 check("sync/network-failure-preserves-queue"){val name="offline-"+UUID.randomUUID()+".db";val a=SyncRepository(context,name);a.login("alice@example.test","benchmark-password");val n=a.save(null,"Retry");a.close();val broken=SyncRepository(context,name,"http://127.0.0.1:1/");try{assertFalse(broken.sync());assertEquals(n.operationId,broken.db.entries().find(n.id)!!.operationId);assertTrue(broken.db.entries().find(n.id)!!.dirty)}finally{broken.close()};val back=SyncRepository(context,name);try{assertTrue(back.sync());assertFalse(back.db.entries().find(n.id)!!.dirty)}finally{back.close();context.deleteDatabase(name)}}
 check("sync/response-loss-replay-idempotent"){withRepo{r->val n=r.save(null,"Replay");val prefs=context.getSharedPreferences("session-"+r.name,Context.MODE_PRIVATE);val cookie=prefs.getString("cookie","")!!;val api=retrofit2.Retrofit.Builder().baseUrl(r.baseUrl).build().create(SyncApi::class.java);val body=JSONObject().put("operationId",n.operationId).put("id",n.id).put("baseVersion",0).put("title",n.title).put("completed",false).put("deleted",false);val first=api.push(cookie,requestBody(body)).execute();assertEquals(200,first.code());first.body()?.close();assertTrue(r.sync());assertEquals(1,r.db.entries().find(n.id)!!.version)}}
 check("sync/account-isolation"){withRepo{a->val n=a.save(null,"Private");assertTrue(a.sync());val name="bob-"+UUID.randomUUID()+".db";val b=SyncRepository(context,name);try{b.login("bob@example.test","benchmark-password");assertTrue(b.sync());assertNull(b.db.entries().find(n.id))}finally{b.close();context.deleteDatabase(name)}}}
 check("ui/login-create-edit"){
 compose.onNodeWithTag("login").performClick();compose.waitUntil(5000){compose.onAllNodesWithTag("new").fetchSemanticsNodes().isNotEmpty()};compose.onNodeWithTag("new").performClick();compose.onNodeWithTag("title").performTextInput(uiTitle);compose.onNodeWithTag("save").performClick();compose.waitUntil(5000){compose.onAllNodesWithTag("new").fetchSemanticsNodes().isNotEmpty()};compose.waitUntil(5000){compose.onAllNodesWithText(uiTitle,substring=true).fetchSemanticsNodes().isNotEmpty()};compose.onNodeWithText(uiTitle,substring=true).performClick();compose.onNodeWithTag("title").performTextReplacement(uiEdited);compose.onNodeWithTag("completed").performClick();compose.onNodeWithTag("save").performClick();compose.waitUntil(5000){compose.onAllNodesWithTag("new").fetchSemanticsNodes().isNotEmpty()};compose.waitUntil(5000){compose.onAllNodesWithText(uiEdited,substring=true).fetchSemanticsNodes().isNotEmpty()}
 }
 check("ui/manual-sync-recreate"){
 compose.onNodeWithTag("sync").performClick();compose.waitUntil(10000){compose.onAllNodesWithText("Synced").fetchSemanticsNodes().isNotEmpty()};compose.activityRule.scenario.recreate();compose.onNodeWithText(uiEdited,substring=true).performScrollTo().assertIsDisplayed()
 }
 check("ui/delete"){compose.onNodeWithText(uiEdited,substring=true).performScrollTo().performClick();compose.onNodeWithTag("delete").performClick();compose.waitUntil(5000){compose.onAllNodesWithText(uiEdited,substring=true).fetchSemanticsNodes().isEmpty()}}

 report()
 }
}

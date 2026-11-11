package bench.app
import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.unit.dp
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewmodel.compose.viewModel
import androidx.navigation.compose.*
import kotlinx.coroutines.*
class ChecklistViewModel:ViewModel(){var status by mutableStateOf("")}
class MainActivity:ComponentActivity(){override fun onCreate(state:Bundle?){super.onCreate(state);setContent{MaterialTheme{ChecklistApp()}}}}
@Composable fun ChecklistApp(){
 val context=androidx.compose.ui.platform.LocalContext.current;val repo=remember{SyncRepository(context)};DisposableEffect(repo){onDispose{repo.close()}}
 val vm:ChecklistViewModel=viewModel();val nav=rememberNavController();val scope=rememberCoroutineScope();var logged by remember{mutableStateOf(repo.signedIn())}
 var email by remember{mutableStateOf("alice@example.test")};var password by remember{mutableStateOf("benchmark-password")};var items by remember{mutableStateOf(listOf<Entry>())};var selected by remember{mutableStateOf<Entry?>(null)};var title by remember{mutableStateOf("")};var completed by remember{mutableStateOf(false)}
 suspend fun load(){items=withContext(Dispatchers.IO){repo.list()}}
 fun action(block:suspend()->Unit){scope.launch(Dispatchers.Main.immediate){try{block()}catch(e:Exception){vm.status=e.message?:"error"}}}
 LaunchedEffect(logged){load()}
 Column(Modifier.padding(16.dp).verticalScroll(rememberScrollState())){Text("Synced checklist");Text(vm.status,Modifier.testTag("status"));if(!logged){OutlinedTextField(email,{email=it},label={Text("Email")},modifier=Modifier.testTag("email"));OutlinedTextField(password,{password=it},label={Text("Password")},modifier=Modifier.testTag("password"));Button(onClick={action{withContext(Dispatchers.IO){repo.login(email,password)};logged=true}},modifier=Modifier.testTag("login")){Text("Login")}}else{
 Button(onClick={action{val ok=withContext(Dispatchers.IO){repo.sync()};vm.status=if(ok)"Synced" else "Pending retry";if(!ok)repo.enqueue();load()}},modifier=Modifier.testTag("sync")){Text("Sync")}
 NavHost(nav,startDestination="list"){
 composable("list"){Column{Button(onClick={selected=null;title="";completed=false;nav.navigate("edit")},modifier=Modifier.testTag("new")){Text("New item")};for(item in items)TextButton(onClick={selected=item;title=item.title;completed=item.completed;nav.navigate("edit")},modifier=Modifier.testTag("item-"+item.id)){Text(item.title+(if(item.dirty)" [pending]" else "")+(if(item.conflict)" [conflict]" else ""))}}}
 composable("edit"){Column{OutlinedTextField(title,{title=it},label={Text("Title")},modifier=Modifier.testTag("title"));Row{Checkbox(completed,{completed=it},modifier=Modifier.testTag("completed"));Text("Completed")};Button(onClick={action{withContext(Dispatchers.IO){repo.save(selected?.id,title,completed)};repo.enqueue();load();nav.popBackStack()}},modifier=Modifier.testTag("save")){Text("Save")};if(selected!=null)Button(onClick={action{withContext(Dispatchers.IO){repo.delete(selected!!.id)};repo.enqueue();load();nav.popBackStack()}},modifier=Modifier.testTag("delete")){Text("Delete")};Button(onClick={nav.popBackStack()},modifier=Modifier.testTag("cancel")){Text("Cancel")}}}
 }
 }}
}

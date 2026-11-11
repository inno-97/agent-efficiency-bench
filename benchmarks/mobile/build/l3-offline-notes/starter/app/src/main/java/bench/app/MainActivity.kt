package bench.app
import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.activity.result.PickVisualMediaRequest
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.unit.dp
import kotlinx.coroutines.launch
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewmodel.compose.viewModel
import androidx.navigation.compose.*
class NotesViewModel:ViewModel(){var error by mutableStateOf("")}
class MainActivity:ComponentActivity(){override fun onCreate(state:Bundle?){super.onCreate(state);setContent{MaterialTheme{NotesApp()}}}}
@Composable fun NotesApp(){
 val context=androidx.compose.ui.platform.LocalContext.current
 val repo=remember{NoteRepository(context)};DisposableEffect(repo){onDispose{repo.close()}}
 val vm:NotesViewModel=viewModel();val scope=rememberCoroutineScope();val nav=rememberNavController()
 var items by remember{mutableStateOf(listOf<Note>())};var selected by remember{mutableStateOf<Note?>(null)}
 var title by remember{mutableStateOf("")};var body by remember{mutableStateOf("")};var tags by remember{mutableStateOf("")};var query by remember{mutableStateOf("")};var tag by remember{mutableStateOf("")}
 suspend fun load(){items=withContext(Dispatchers.IO){repo.list(query,tag)}}
 fun action(block:suspend()->Unit){scope.launch(Dispatchers.Main.immediate){try{block();vm.error=""}catch(e:Exception){vm.error=e.message?:"error"}}}
 val picker=rememberLauncherForActivityResult(ActivityResultContracts.PickVisualMedia()){uri->if(uri!=null&&selected!=null)action{selected=withContext(Dispatchers.IO){repo.attach(selected!!.id){context.contentResolver.openInputStream(uri)}}}}
 LaunchedEffect(query,tag){load()}
 Column(Modifier.padding(16.dp).verticalScroll(rememberScrollState())){Text("Offline notes");Text(vm.error,Modifier.testTag("error"));NavHost(nav,startDestination="list"){
 composable("list"){Column{OutlinedTextField(query,{query=it},label={Text("Search")},modifier=Modifier.testTag("query"));OutlinedTextField(tag,{tag=it},label={Text("Tag filter")},modifier=Modifier.testTag("tag-filter"));Button(onClick={selected=null;title="";body="";tags="";nav.navigate("edit")},modifier=Modifier.testTag("new")){Text("New note")};for(note in items)TextButton(onClick={selected=note;nav.navigate("detail")},modifier=Modifier.testTag("note-"+note.id)){Text(note.title)}}}
 composable("detail"){Column{Text(selected?.title?:"",Modifier.testTag("detail-title"));Text(selected?.body?:"");Text(selected?.tags?:"");Text(if(selected?.photo==null)"No photo" else "Photo attached",Modifier.testTag("photo-state"));Button(onClick={title=selected!!.title;body=selected!!.body;tags=selected!!.tags;nav.navigate("edit")},modifier=Modifier.testTag("edit")){Text("Edit")};Button(onClick={picker.launch(PickVisualMediaRequest(ActivityResultContracts.PickVisualMedia.ImageOnly))},modifier=Modifier.testTag("attach")){Text("Choose photo")};Button(onClick={action{selected=withContext(Dispatchers.IO){repo.removePhoto(selected!!.id)}}},modifier=Modifier.testTag("remove-photo")){Text("Remove photo")};Button(onClick={action{withContext(Dispatchers.IO){repo.delete(selected!!.id)};selected=null;load();nav.popBackStack("list",false)}},modifier=Modifier.testTag("delete")){Text("Delete")};Button(onClick={nav.popBackStack()},modifier=Modifier.testTag("back")){Text("Back")}}}
 composable("edit"){Column{OutlinedTextField(title,{title=it},label={Text("Title")},modifier=Modifier.testTag("title"));OutlinedTextField(body,{body=it},label={Text("Body")},modifier=Modifier.testTag("body"));OutlinedTextField(tags,{tags=it},label={Text("Tags")},modifier=Modifier.testTag("tags"));Button(onClick={action{withContext(Dispatchers.IO){repo.save(selected?.id,title,body,tags)};load();nav.popBackStack("list",false)}},modifier=Modifier.testTag("save")){Text("Save")};Button(onClick={nav.popBackStack()},modifier=Modifier.testTag("cancel")){Text("Cancel")}}}
 }}
}

# Android contract v1.0.0

Constrained build/fix: keep supplied Kotlin/Compose UI and repository API. JDK17, API35, Room database; no in-memory replacement. Repository methods execute on IO coroutines. Tests are external and may reopen databases or launch another process. No broad storage permission. Package bench.app.

## Offline notes
- NoteRepository(context,name="notes.db"): save(id?,title,body,tags), list(query="",tag=""), delete(id), attach(id,source?), removePhoto(id), close(). Room schema Note and NoteDao supplied.
- New ID UUID; edits retain ID and current attachment. Unknown edit/attachment ID throws IllegalArgumentException; unknown delete no-op.
- Title trimmed1..120; body<=5000; comma-separated tags trimmed, empty entries omitted, unique sorted, at most5 tags each<=30; invalid input throws without changing existing records.
- list searches title OR body case-insensitively, combines exact tag; order title then id. No cloud/auth.
- attach's source=null represents picker cancellation, preserving note/photo. Non-null source returns stream; null stream, read/copy failure, empty file, >5MiB throw and preserve prior DB/file with no leaked temporary file. Close streams.
- Copy selected photo into filesDir/note-photos with generated name; preserve bytes after URI expires and after process restart. Replace only after successful copy. Delete replaced photo, removePhoto persists null and deletes file, delete note removes photo. Never delete paths outside note-photos.
- UI list/search/tag, detail/edit/delete; Android Photo Picker for one image, visible errors, cancellation leaves unchanged. Stored photo state visible; image preview styling is outside scoring.

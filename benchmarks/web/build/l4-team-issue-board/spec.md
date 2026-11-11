# Contract v1.0.0

This is a constrained benchmark, not a production service. Implement the supplied UI's HTTP endpoints. PostgreSQL, Prisma, Next.js and seeded accounts are required. Do not replace storage with memory/localStorage or remove authentication. Keep schema and public API compatible; tests are external.

## Common HTTP and sessions
- JSON request/response; validation=400, malformed JSON=400, non-JSON payload for JSON-body endpoints=415. Unknown route=404.
- POST /api/login {email,password}; seed accounts alice/bob/carol@example.test, password benchmark-password. Invalid credentials=401. Return {id}. Issue random opaque server session: HttpOnly, SameSite=Lax, Path=/, Max-Age=3600. Store a SHA256 token hash; password uses scrypt salt:digest. Session expires in one hour. No client-provided user identity is trusted.
- GET /api/me -> {id}; POST /api/logout -> {ok:true}, revoke session and clear cookie. Protected requests without valid nonexpired session=401. Mutation with a foreign Origin=403. Local HTTP does not require Secure; deployment is outside this task.
- Server restart must preserve DB data and valid sessions. Reset/seed only outside timed agent work. No registration or external network.

## Team permissions
Seed p1 Alpha owner alice with bob member; p2 Private owner carol. Project membership checked against DB on every request (including existing sessions). Outsiders get 404. Owners have implicit membership.
- GET /api/projects -> array of accessible projects ordered id ASC.
- GET /api/projects/:p/members -> members; POST {userId} -> 201 upsert; DELETE /:userId -> {ok:true}. Only owner may add/remove (403 for members); unknown user=400, removing owner=400. Removal immediately revokes every nested resource access. Re-add restores access.
- GET/POST /api/projects/:p/issues -> array/201; GET/PATCH/DELETE /:issue -> item/item/{ok:true}. Any member may create/read; only author or project owner may edit/delete (403). ID must belong to URL project (404). Server assigns authorId/projectId.
- Full issue payload title trimmed1..120, body trimmed<=2000, status open(default) or done. Invalid=400. Order createdAt ASC then id ASC.
- GET/POST /api/projects/:p/issues/:i/comments -> array/201, body trimmed1..1000. Server assigns issue and author. DELETE /:comment allowed only comment author or project owner, otherwise403. Validate complete project/issue/comment relationship (404).
- Deleting issue atomically deletes its comments. UI: login/project list/issue list/detail/edit, comments and owner member controls; errors visible. No billing, invitations, attachments, realtime.

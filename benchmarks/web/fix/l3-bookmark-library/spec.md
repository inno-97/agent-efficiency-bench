# Contract v1.0.0

This is a constrained benchmark, not a production service. Implement the supplied UI's HTTP endpoints. PostgreSQL, Prisma, Next.js and seeded accounts are required. Do not replace storage with memory/localStorage or remove authentication. Keep schema and public API compatible; tests are external.

## Common HTTP and sessions
- JSON request/response; validation=400, malformed JSON=400, non-JSON payload for JSON-body endpoints=415. Unknown route=404.
- POST /api/login {email,password}; seed accounts alice/bob/carol@example.test, password benchmark-password. Invalid credentials=401. Return {id}. Issue random opaque server session: HttpOnly, SameSite=Lax, Path=/, Max-Age=3600. Store a SHA256 token hash; password uses scrypt salt:digest. Session expires in one hour. No client-provided user identity is trusted.
- GET /api/me -> {id}; POST /api/logout -> {ok:true}, revoke session and clear cookie. Protected requests without valid nonexpired session=401. Mutation with a foreign Origin=403. Local HTTP does not require Secure; deployment is outside this task.
- Server restart must preserve DB data and valid sessions. Reset/seed only outside timed agent work. No registration or external network.

## Bookmarks
- GET /api/bookmarks?q=&tag=&page=1 -> {items,total,page}, page integer 1..10000, fixed size 5. Filter own records before pagination. Search title case-insensitively, tag exact; combine filters. Order createdAt ASC then id ASC.
- POST /api/bookmarks -> 201; GET/PATCH/DELETE /api/bookmarks/:id -> 200. Missing or another user's ID=404 for every operation. Delete -> {ok:true}.
- Full create/update payload: title trimmed 1..120, url valid http(s), tags default [], at most 5 trimmed nonempty strings of <=30; deduplicate after validation. Ignore userId/id fields. Preserve ID, owner and creation time on edit.
- UI: login/logout, list/search/tag/pagination, create/detail/edit/delete; errors visible, plain text rendering. Reload persists data. No sharing, crawling, registration.

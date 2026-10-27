# Department testing log

Send each request in `department.json` by hand. Write `[x]` when the answer is what "Expected" says, add the date, and write what you saw if it was not. Reseed first when the Expected text says so. Ids in the URL (alerts) change after every reseed: copy a fresh id from the list response.

| # | Request | Expected | Result | Date | Notes |
|---|---|---|---|---|---|
| 1 | GET /department/issues - 1 No token gives 401 | Expected: 401, code unauthorized. No Authorization header is sent on purpose. | [x] | 2026-10-27 | 401 |
| 2 | GET /department/issues - 2 Citizen token on department route gives 403 | Expected: 403, code forbidden. Put a citizen token in the Authorization header. | [x] | 2026-10-27 | 403 |
| 3 | GET /department/issues?scope=assigned - 3 Assigned list: 3 issues, ranked, no Waste | Expected: 200. data holds 3 issues, ranked 1, 2, 3, and the first title is "Cracked footbridge rail". No Waste issue and no reopened issue. Send on a freshly seeded database. | [x] | 2026-10-27 | 200, 3 issues |
| 4 | GET /department/issues?scope=completed - 4 Completed list: 1 resolved issue | Expected: 200. data holds 1 issue and its status is resolved. | [x] | 2026-10-27 | 200, 1 resolved |
| 5 | GET /department/issues?scope=nonsense - 5 Bad scope gives 400 | Expected: 400, code invalid, field scope. | [x] | 2026-10-27 | 400 invalid scope |
| 6 | GET /department/summary - 6 Summary equals the list | Expected: 200. data is assigned 3, open 2, inProgress 1, awaiting 0, completed 1 on a fresh seed. open + inProgress + awaiting equals assigned. Send before requests 7 and 11, because they change the counts. | [x] | 2026-10-27 | 200, 3/2/1/0/1 |
| 7 | PATCH /department/issues/a1b2c3000000000000000001/status - 7 Start work: first call 200 | Expected: 200. data.status is in-progress and data.startedAt is a date string. The reporter gets an in-progress alert. This changes the database, so re-seed before sending it again. | [x] | 2026-10-27 | 200, in-progress |
| 8 | PATCH /department/issues/a1b2c3000000000000000001/status - 8 Start work: second call 409 | Expected: 409, code conflict. Send right after request 7. | [x] | 2026-10-27 | 409 conflict |
| 9 | PATCH /department/issues/a1b2c3000000000000000004/status - 9 Start work on a Waste issue gives 403 | Expected: 403, code forbidden. This issue belongs to the Waste department and stays open. | [x] | 2026-10-27 | 403 forbidden |
| 10 | POST /department/issues/a1b2c3000000000000000002/submit - 10 Submit without a photo gives 400 | Expected: 400, code invalid, field photoUrl. The body has a note but no photo. | [x] | 2026-10-27 | 400 invalid photoUrl |
| 11 | POST /department/issues/a1b2c3000000000000000002/submit - 11 Submit with a photo gives 200 | Expected: 200. data.verification is awaiting and data.departmentNote is Patched. The reporter and the admins get an alert. This changes the database, so re-seed before sending it again. | [x] | 2026-10-27 | 200, awaiting |
| 12 | POST /department/issues/a1b2c3000000000000000002/submit - 12 Submit again gives 409 | Expected: 409, code conflict. Send right after request 11. | [x] | 2026-10-27 | 409 conflict |
| 13 | GET /citizen/profile - 13 Citizen profile gives 200, no NID photo | Expected: 200. data.division is Dhaka, the text has no photo and no passwordHash, and identity.status is "not-submitted" when no NID was sent. It is "pending" while a submitted NID waits for admin review. | [x] | 2026-10-27 | 200, identity pending (NID 4821 kept) |
| 14 | GET /citizen/profile - 14 Profile with a department token gives 403 | Expected: 403, code forbidden. A department token is not allowed on a citizen route. | [x] | 2026-10-27 | 403 |
| 15 | GET /department/alerts - 15 List alerts | Expect 200. data.alerts has 3 items, newest first. data.unreadCount is 2. Reseed first: node scripts/seed-dept-alerts.js | [x] | 2026-10-27 | 200, 3 items, unreadCount 2 (checked again after reseed) |
| 16 | GET /department/alerts/unread-count - 16 Unread count | Expect 200. data.unreadCount is 2 after a fresh seed. It is 1 after request 17 has run. | [x] | 2026-10-27 | 200, 2 on fresh seed, 1 after request 17 |
| 17 | PATCH /department/alerts/6addbc14ba4d8a6e36bc0762/read - 17 Mark one read | Expect 200. data.read is true. The id comes from request 15, so it changes after every reseed. | [x] | 2026-10-27 | 200, read true (fresh id from request 15) |
| 18 | PATCH /department/alerts/6addbb31ce059f28d7f261d7/read - 18 Someone else’s alert gives 404 | Expect 404 not-found. This id belongs to another staff member (power@babylon.test). The id changes after every reseed. | [x] | 2026-10-27 | 404, real Power alert id taken from the database, Roads token |
| 19 | PATCH /department/alerts/abc/read - 19 Bad id gives 404 | Expect 404 not-found. | [x] | 2026-10-27 | 404 not-found |
| 20 | POST /department/alerts/read-all - 20 Read all | Expect 200. data.unreadCount is 0. | [x] | 2026-10-27 | 200, unreadCount 0 |
| 21 | GET /department/alerts - 21 No token gives 401 | Expect 401 unauthorized. | [x] | 2026-10-27 | 401 |
| 22 | GET /department/alerts - 22 Citizen token gives 403 | Expect 403 forbidden. | [x] | 2026-10-27 | 403 |

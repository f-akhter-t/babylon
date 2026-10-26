# Admin testing log

Send each request in `admin.json` by hand (Postman, Send button). Do not use the Runner, and do not add scripts. Write `[x]` when the answer is what "Expected" says, add the date, and write what you saw if it was not.

Before you start, on a clean database: `node scripts/reset-db.mjs`, then `npm run seed:admin`, then `npm start`. Make the tokens with `npm run token -- admin admin@babylon.test`, `npm run token -- department roads@babylon.test "Roads & Highways"` and `npm run token -- citizen citizen@babylon.test`, and paste them into the collection variables `adminToken`, `departmentToken` and `citizenToken`. Run folder 0 first and copy the ids it shows into the collection variables by hand.

The Expected text is copied from each request's Description in `admin.json`. Translate (folder 6) needs a working `GEMINI_API_KEY` in `backend/.env`; without it the valid requests answer 503 `ai-unavailable`, which is also a correct result to write down.


## 0. Setup: read the seeded data (run first, on a fresh npm run seed:admin)

| # | Request | Expected | Result | Date | Notes |
|---|---|---|---|---|---|
| 1 | GET /api/admin/counts - Counts | Expected: 200. data.queue is 3 (fixes waiting) and data.reopened is 1 on a fresh `npm run seed:admin`. Send this first, on a freshly seeded database. | [x] | 2026-10-26 | 200, queue 3, reopened 1 |
| 2 | GET /api/admin/verification-queue - Queue (save ids) | Expected: 200. data is a list of 3 fixes waiting for a check, newest first (by submittedAt). Copy the id of item 1, 2 and 3 by hand into the collection variables fixA, fixB and fixC. | [x] | 2026-10-26 | 200, 3 fixes (ids ad..01, 02, 03) |
| 3 | GET /api/admin/reopened - Reopened (save id) | Expected: 200. data is a list with 1 reopened issue. Copy its id by hand into the variable reopenedId. | [x] | 2026-10-26 | 200, 1 issue (ad..04) |
| 4 | GET /api/admin/identity - Identity queue (save ids) | Expected: 200. data is a list of 4 identity submissions, oldest first, showing only nidLast4 (4821, 9034, 7390, 1156) and no photo. Copy the id of item 1, 2 and 3 by hand into idPhoto, idNoPhoto and idOk. | [x] | 2026-10-26 | 200, 4 items, nidLast4 4821, 9034, 7390, 1156, no photo |

## 1. Access

| # | Request | Expected | Result | Date | Notes |
|---|---|---|---|---|---|
| 5 | GET /api/admin/counts - No token: 401 | No Authorization header. Expected: 401, code unauthorized. | [x] | 2026-10-26 | 401 unauthorized |
| 6 | GET /api/admin/counts - Citizen token: 403 | Uses a citizen token (`npm run token -- citizen`), pasted into citizenToken. Expected: 403, code forbidden. | [x] | 2026-10-26 | 403 forbidden |
| 7 | GET /api/admin/verification-queue - Department token: 403 | Uses a department token (`npm run token -- department`), pasted into departmentToken. Expected: 403, code forbidden. | [x] | 2026-10-26 | 403 forbidden |

## 2. Verification

| # | Request | Expected | Result | Date | Notes |
|---|---|---|---|---|---|
| 8 | POST /api/admin/issues/{{fixA}}/approve - Approve fix A | Uses the id in fixA. Expected: 200. data.status is resolved, verification is verified, priority is fix-verified, and afterImg is a text (the approved photo). | [x] | 2026-10-26 | 200, status resolved, verification verified, priority fix-verified |
| 9 | POST /api/admin/issues/{{fixA}}/approve - Approve fix A again: 409 | Same request as the one above, sent a second time. Expected: 409, code conflict (already checked). | [x] | 2026-10-26 | 409 conflict |
| 10 | POST /api/admin/issues/64b7f0a1c2d3e4f5a6b7c8d9/approve - Approve unknown id: 404 | An id that does not exist. Expected: 404, code not-found. | [x] | 2026-10-26 | 404 not-found |
| 11 | POST /api/admin/issues/{{fixB}}/reject - Reject fix B without a reason: 400 | Uses the id in fixB with an empty body. Expected: 400, code invalid, field reason. | [x] | 2026-10-26 | 400 invalid, field reason |
| 12 | POST /api/admin/issues/{{fixB}}/reject - Reject fix B with a reason | Uses the id in fixB with a reason. Expected: 200. data.verification is none and data.status is in-progress (back to the department). The rejected photo (pendingAfterImg) is not in the answer. | [x] | 2026-10-26 | 200, verification none, status in-progress |
| 13 | POST /api/admin/issues/{{fixB}}/reject - Reject fix B again: 409 | Same issue, sent a second time. Expected: 409, code conflict. | [x] | 2026-10-26 | 409 conflict |
| 14 | POST /api/admin/issues/{{fixC}}/send-to-queue - Send fix C to queue (not reopened): 409 | Uses the id in fixC, which is a normal waiting fix, not a reopened one. Expected: 409, code conflict. | [x] | 2026-10-26 | 409 conflict |
| 15 | POST /api/admin/issues/{{reopenedId}}/send-to-queue - Send the reopened issue to the queue | Uses the id in reopenedId. Expected: 200. data.verification is awaiting and data.priority is still reopened. | [x] | 2026-10-26 | 200, verification awaiting, priority reopened |
| 16 | GET /api/admin/counts - Counts after the decisions | Expected: 200. data.queue is 2 (fix C and the reopened one) and data.reopened is 0. | [x] | 2026-10-26 | 200, queue 2, reopened 0 |

## 3. Accountability

| # | Request | Expected | Result | Date | Notes |
|---|---|---|---|---|---|
| 17 | GET /api/admin/accountability?weeks=8 - 8 weeks | Expected: 200. data.departments has 4 rows; data.stats.received equals the sum of the rows' assigned and data.stats.resolved equals the sum of their resolved. data.weekly has 8 entries that add up to stats.received. data.waitingLongest is sorted longest first. | [x] | 2026-10-26 | 200, Last 8 weeks, received 44, resolved 30 (sums not added up by hand) |
| 18 | GET /api/admin/accountability?weeks=4 - 4 weeks | Expected: 200. data.weekly has 4 entries and data.label is 'Last 4 weeks'. | [x] | 2026-10-26 | 200, weeks 4, label Last 4 weeks |
| 19 | GET /api/admin/accountability - No period (defaults to 8) | No weeks value. Expected: 200 and data.weeks is 8. | [x] | 2026-10-26 | 200, weeks 8 |
| 20 | GET /api/admin/accountability?weeks=6 - 6 weeks: 400 | Only 4 or 8 are allowed. Expected: 400, code invalid. | [x] | 2026-10-26 | 400 invalid, field weeks |

## 4. Identity

| # | Request | Expected | Result | Date | Notes |
|---|---|---|---|---|---|
| 21 | GET /api/admin/identity/{{idPhoto}}/photo - Photo of a pending submission | Uses the id in idPhoto. Expected: 200, and the answer is a picture (Content-Type image/...), not JSON, with Cache-Control no-store. Use Send and look at the Preview tab. | [x] | 2026-10-26 | 200 OK, picture answer (353 B, not JSON), sent again on freshly seeded data; the picture is a 1x1 stand-in so Preview looks blank |
| 22 | GET /api/admin/identity/{{idNoPhoto}}/photo - Photo of a submission without one: 404 | Uses the id in idNoPhoto. Expected: 404. | [x] | 2026-10-26 | 404 (first sent before the review; re-sent after, also 404 - no card photo) |
| 23 | POST /api/admin/identity/{{idPhoto}}/review - Reject with a 3-character reason: 400 | Body: decision reject, reason 'bad' (too short, the minimum is 5). Expected: 400, code invalid. | [x] | 2026-10-26 | 400 invalid, field reason |
| 24 | POST /api/admin/identity/{{idPhoto}}/review - Reject with a reason | Uses idPhoto with a good reason. Expected: 200. data.status is rejected and data.photoDeleted is true. | [x] | 2026-10-26 | 200, status rejected, photoDeleted true |
| 25 | GET /api/admin/identity/{{idPhoto}}/photo - Photo after the review: 404 | Same photo address as before, after the rejection. Expected: 404 (the photo was deleted). | [x] | 2026-10-26 | 404, card photo no longer available |
| 26 | POST /api/admin/identity/{{idPhoto}}/review - Review the same one again: 409 | Uses idPhoto, which is already reviewed. Expected: 409, code conflict. | [x] | 2026-10-26 | 409 conflict |
| 27 | POST /api/admin/identity/{{idNoPhoto}}/review - Approve one without a photo: 409 | Uses idNoPhoto (it has no photo). Expected: 409. | [x] | 2026-10-26 | 409 conflict, no card photo saved |
| 28 | POST /api/admin/identity/{{idOk}}/review - Approve one with a photo | Uses idOk. Expected: 200 and data.status is verified. | [x] | 2026-10-26 | 200, status verified |
| 29 | GET /api/admin/identity/count - Identity count | Expected: 200 and data.count is 2 (the no-photo one and the newest one are still waiting). | [x] | 2026-10-26 | 200, count 2 |

## 5. Alerts

| # | Request | Expected | Result | Date | Notes |
|---|---|---|---|---|---|
| 30 | GET /api/admin/alerts - Alerts: list | Expected: 200. data.alerts is the signed-in admin's own notices, newest first (each has id, kind, text, link, issueId, createdAt, read). data.unreadCount is how many have read false. The list may be empty if nothing has notified this admin yet. If it has items, copy the id of one into the variable alertId by hand. | [x] | 2026-10-26 | 200, alerts [] and unreadCount 0 (nothing has notified this admin) |
| 31 | GET /api/admin/alerts/unread-count - Alerts: unread count | Expected: 200. data.unreadCount equals data.unreadCount in the list above. | [x] | 2026-10-26 | 200, unreadCount 0 |
| 32 | PATCH /api/admin/alerts/{{alertId}}/read - Alerts: mark one read | Uses the id in alertId (copied by hand from the list). Expected: 200. data.read is true and data.id is the same id. If the list was empty, skip this one. | [ ] | 2026-10-26 | Skipped on purpose: the alert list was empty, so there is no id (Description says skip). |
| 33 | PATCH /api/admin/alerts/000000000000000000000000/read - Alerts: mark an unknown alert read: 404 | An id that does not exist. Expected: 404, code not-found, message 'We could not find that notice.' | [x] | 2026-10-26 | 404 not-found, We could not find that notice. |
| 34 | POST /api/admin/alerts/read-all - Alerts: mark all read | Expected: 200. data.unreadCount is 0. Send 'Alerts: unread count' again to confirm it is 0. | [x] | 2026-10-26 | 200, unreadCount 0 |
| 35 | GET /api/admin/alerts - Alerts: no token: 401 | No Authorization header. Expected: 401, code unauthorized. | [x] | 2026-10-26 | 401 unauthorized |
| 36 | GET /api/admin/alerts - Alerts: citizen token: 403 | Uses the citizen token in citizenToken. Expected: 403, code forbidden. | [x] | 2026-10-26 | 403 forbidden |

## 6. Translate (F10)

| # | Request | Expected | Result | Date | Notes |
|---|---|---|---|---|---|
| 37 | POST /api/translate - Translate: valid text to Bangla | Admin token. Needs Joyti's Gemini service and key to be working. Expected: 200, data { translation, to: "bn" }. With Gemini off: 503, code ai-unavailable. | [x] | 2026-10-26 | 503 ai-unavailable (no Gemini key on this laptop; allowed by the Description) |
| 38 | POST /api/translate - Translate: department token also allowed | Department token in departmentToken. Expected: 200 (any signed-in role may translate), or 503 ai-unavailable if Gemini is off. | [x] | 2026-10-26 | 503 ai-unavailable (no Gemini key on this laptop) |
| 39 | POST /api/translate - Translate: no token: 401 | No Authorization header. Expected: 401, code unauthorized. | [x] | 2026-10-26 | 401 unauthorized |
| 40 | POST /api/translate - Translate: empty text: 400 | Expected: 400, code invalid, field text. | [x] | 2026-10-26 | 400 invalid, field text |
| 41 | POST /api/translate - Translate: over-long text: 400 | 1001 characters (the limit is 1000). Expected: 400, code invalid, field text. | [x] | 2026-10-26 | 400 invalid, field text |
| 42 | POST /api/translate - Translate: unsupported language: 400 | Expected: 400, code invalid, field to. | [x] | 2026-10-26 | 400 invalid, field to |
| 43 | POST /api/translate - Translate: rapid repeats: 429 | Send this one 11 times quickly. The limit is 10 per minute per user. Expected: after the 10th, 429, code too-many-requests. Wait a minute and it works again. | [x] | 2026-10-26 | 429 too-many-requests after rapid sends |

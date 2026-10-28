# Citizen profile testing log

Send each request in `citizen-profile.json` by hand. Write `[x]` when the answer is what "Expected" says, add the date, and write what you saw if it was not. Reseed first when the Expected text says so. Ids in the URL (alerts) change after every reseed: copy a fresh id from the list response.

| # | Request | Expected | Result | Date | Notes |
|---|---|---|---|---|---|
| 1 | GET /citizen/profile - 01 Get profile | Expect 200. data has name, email, role "citizen", department null, phone, phoneVerified, address, division, identity, isVerified false, jobTitle, employeeId, onboarded. identity.status is "not-submitted" for an account with no NID, and "pending" (nidLast4 and submittedAt filled in) while a submitted NID waits for admin review. Token: npm run token --silent -- citizen citizen@babylon.test. | [x] | 2026-10-27 | 200, identity pending (NID 4821) |
| 2 | GET /citizen/profile - 02 Get profile, no token | Expect 401, code "unauthorized". | [x] | 2026-10-27 | 401 |
| 3 | GET /citizen/profile - 03 Get profile, department token | Expect 403, code "forbidden". Use a department token. | [x] | 2026-10-27 | 403 |
| 4 | PATCH /citizen/profile - 04 Update profile | Expect 200 and the saved profile. Phone and email in the body are ignored. | [x] | 2026-10-27 | 200 |
| 5 | PATCH /citizen/profile - 05 Update profile, empty body | Expect 400, code "invalid". Nothing changes. | [x] | 2026-10-27 | 400 invalid |
| 6 | POST /citizen/profile/phone-code - 06 Phone code, new number | Expect 200. data {phone "01812345678", resendIn 30}. The phone is not saved yet. | [x] | 2026-10-27 | matches Docs |
| 7 | POST /citizen/profile/phone-code - 07 Phone code, resend at once | Send right after request 06. Expect 429, code "too-many-requests", field "phone". | [x] | 2026-10-27 | matches Docs |
| 8 | POST /citizen/profile/phone-code - 08 Phone code, already verified number | Expect 400, code "invalid", field "phone", message "This number is already verified." Works on a fresh seed. | [x] | 2026-10-27 | matches Docs |
| 9 | POST /citizen/profile/phone-code - 09 Phone code, bad number | Expect 400, code "invalid", field "phone". | [x] | 2026-10-27 | 400 invalid, field phone |
| 10 | POST /citizen/profile/phone-code - 10 Phone code, no token | Expect 401. | [x] | 2026-10-27 | 401 |
| 11 | POST /citizen/profile/phone-verify - 11 Phone verify, right code | Send after request 06 (dev code mode). Expect 200. data.phone "01812345678", phoneVerified true. | [x] | 2026-10-27 | matches Docs |
| 12 | POST /citizen/profile/phone-verify - 12 Phone verify, wrong code | Send after a fresh request 06. Expect 400, code "invalid", field "code", message shows tries left. Send it 3 times in a row: the 3rd gives 423, code "locked". | [x] | 2026-10-27 | matches Docs; a new code (06) still gave 200 after the lock |
| 13 | POST /citizen/profile/phone-verify - 13 Phone verify, bad code format | Expect 400, code "invalid", field "code". | [x] | 2026-10-27 | 400 invalid, field code |
| 14 | POST /citizen/profile/identity - 14 Identity, valid | Fresh seed. Expect 200. data.identity {status "pending", nidLast4 "4821", submittedAt a date}. No photo in the answer. | [x] | 2026-10-27 | 200, pending, NID 4821 (after admin reject) |
| 15 | POST /citizen/profile/identity - Identity, oversized photo | Expected: 400. success false, code invalid, field photo. | [x] | 2026-10-27 | matches Docs |
| 16 | POST /citizen/profile/identity - 20 Identity, department token | Expected: 403. success false, code forbidden. | [x] | 2026-10-27 | 403 |
| 17 | POST /citizen/profile/identity - 15 Identity, second submit | Send after request 14. Expect 409, code "conflict". | [x] | 2026-10-27 | 409 conflict, re-sent after row 14 |
| 18 | POST /citizen/profile/identity - 16 Identity, bad digits | Expect 400, code "invalid", field "nidLast4". | [x] | 2026-10-27 | matches Docs |
| 19 | POST /citizen/profile/identity - 17 Identity, not an image | Expect 400, code "invalid", field "photo". | [x] | 2026-10-27 | matches Docs |
| 20 | POST /citizen/profile/identity - 18 Identity, no photo | Expect 400, code "invalid", field "photo". | [x] | 2026-10-27 | 400 invalid, field photo |
| 21 | POST /citizen/profile/identity - 19 Identity, no token | Expect 401. | [x] | 2026-10-27 | 401 (set to No Auth for the test) |
| 22 | POST /citizen/reports/duplicates - F2 duplicates: valid photo (CLIP on) | Expected: 200. data.checked true, data.matches has 1 item with similarity near 1. No imageEmbedding in the match. Needs CLIP on and a filed report in the citizen's division. | [x] | 2026-10-27 | 200, 1 match, similarity 1, no imageEmbedding |
| 23 | POST /citizen/reports/duplicates - F2 duplicates: rate limit | Expected: 429. success false, code too-many-requests. Send the valid body 11 times within 60 seconds. | [x] | 2026-10-27 | 429 too-many-requests after 10 sends |
| 24 | POST /citizen/reports/duplicates - F2 duplicates: CLIP off | Expected: 200. data.checked false, data.matches empty list. CLIP_ENABLED=false in backend/.env. | [x] | 2026-10-27 | 200, checked false, matches empty |
| 25 | POST /citizen/reports/duplicates - F2 duplicates: missing photo | Expected: 400. success false, code invalid, field photoUrl. | [x] | 2026-10-27 | 400 invalid, field photoUrl |
| 26 | POST /citizen/reports/duplicates - F2 duplicates: not an image | Expected: 400. success false, code invalid, field photoUrl | [x] | 2026-10-27 | 400 invalid, field photoUrl |
| 27 | POST /citizen/reports/duplicates - F2 duplicates: staff token gives 403 | Expected: 403. success false, code forbidden. A department (staff) token is not allowed on this citizen route. | [x] | 2026-10-27 | 403 forbidden |
| 28 | POST /citizen/reports/duplicates - F2 duplicates: unrelated photo | Expected: 200. data.checked true, data.matches empty list. | [x] | 2026-10-27 | 200, checked true, matches empty |
| 29 | POST /citizen/reports/duplicates - F2 duplicates: no token gives 401 | Expected: 401. success false, code unauthorized. No Authorization header is sent on purpose. | [x] | 2026-10-27 | 401 unauthorized |
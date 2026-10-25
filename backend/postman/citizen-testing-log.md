# Citizen testing log

Send each request in `citizen.json` by hand. Write `[x]` when the answer is what "Expected" says, add the date, and write what you saw if it was not.

| # | Request | Expected | Result | Date | Notes |
|---|---|---|---|---|---|
| 1 | POST /api/citizen/reports - valid | 201. data.division = Chattogram, data.votes = 1, data.priority = medium, data.status = open. | [ ] |  |  |
| 2 | POST /api/citizen/reports - no photoUrl | 400. code = invalid, field = photoUrl. | [ ] |  |  |
| 3 | POST /api/citizen/reports - description too short | 400. code = invalid, field = description. | [ ] |  |  |
| 4 | POST /api/citizen/reports - no location | 400. code = invalid, field = location. | [ ] |  |  |
| 5 | POST /api/citizen/reports - wrong division | 400. code = invalid, field = location. The citizen lives in Chattogram, so a Dhaka report is refused. | [ ] |  |  |
| 6 | POST /api/citizen/reports - no token | 401. code = unauthorized. | [ ] |  |  |
| 7 | POST /api/citizen/reports - department token | 403. code = forbidden. | [ ] |  |  |
| 8 | GET /api/citizen/reports - mine | 200. data is a list of your own reports, newest first. The report from the valid create is first. | [ ] |  |  |
| 9 | GET /api/citizen/reports - no token | 401. code = unauthorized. | [ ] |  |  |
| 10 | GET /api/citizen/reports - department token | 403. code = forbidden. | [ ] |  |  |
| 11 | GET /api/citizen/reports/:id - mine | 200. data.id equals the id in the URL. | [ ] |  |  |
| 12 | GET /api/citizen/reports/:id - unknown id | 404. code = not-found. | [ ] |  |  |
| 13 | GET /api/citizen/reports/:id - someone else's report | 403. code = forbidden. (The plan accepts 403 or 404 here; this backend answers 403.) | [ ] |  |  |
| 14 | PATCH /api/citizen/reports/:id - change title | 200. data.title = Pothole near gate. | [ ] |  |  |
| 15 | PATCH /api/citizen/reports/:id - title too short | 400. code = invalid, field = title. | [ ] |  |  |
| 16 | PATCH /api/citizen/reports/:id - change description | 200. data.description is the new text. | [ ] |  |  |
| 17 | PATCH /api/citizen/reports/:id - someone else's report | 403. code = forbidden. | [ ] |  |  |
| 18 | PATCH /api/citizen/reports/:id - work already started | 423. code = locked. The report is already in progress, so the citizen can no longer edit it. | [ ] |  |  |
| 19 | DELETE /api/citizen/reports/:id - mine | 200. The report is gone: the same GET afterwards gives 404, and GET /citizen/me shows 60 fewer points. | [ ] |  |  |
| 20 | DELETE /api/citizen/reports/:id - someone else's report | 403. code = forbidden. The report is still there afterwards. | [ ] |  |  |
| 21 | POST /api/citizen/reports/:id/vote - someone else's open issue | 200. The vote count goes up by 1. | [ ] |  |  |
| 22 | POST /api/citizen/reports/:id/vote - same issue again | 200. The count stays the same. One citizen counts once. | [ ] |  |  |
| 23 | POST /api/citizen/reports/:id/vote - my own report | 200. votes stays 1, because the reporter's own vote already counts. | [ ] |  |  |
| 24 | POST /api/citizen/reports/:id/vote - resolved issue | 409. code = conflict. A resolved issue cannot be voted on. | [ ] |  |  |
| 25 | POST /api/citizen/reports/:id/vote - department token | 403. code = forbidden. | [ ] |  |  |
| 26 | POST /api/citizen/reports/:id/vote - no token | 401. code = unauthorized. | [ ] |  |  |
| 27 | DELETE /api/citizen/reports/:id/vote - remove my vote | 200. The vote count goes down by 1. | [ ] |  |  |
| 28 | GET /api/citizen/me | 200. data has name, reports, points, level, role and next tier. points = 60 x the number of reports. | [ ] |  |  |
| 29 | GET /api/citizen/me - no token | 401. code = unauthorized. | [ ] |  |  |
| 30 | GET /api/citizen/points/earn | 200. data is the "How you earn points" list. | [ ] |  |  |
| 31 | GET /api/citizen/alerts | 200. data lists your own alerts, newest first, with unreadCount. | [ ] |  |  |
| 32 | GET /api/citizen/alerts - no token | 401. code = unauthorized. | [ ] |  |  |
| 33 | GET /api/citizen/alerts/unread-count | 200. The number equals unreadCount in the alert list. | [ ] |  |  |
| 34 | PATCH /api/citizen/alerts/:id/read - mine | 200. The alert is read, and the unread count goes down by 1. | [ ] |  |  |
| 35 | PATCH /api/citizen/alerts/:id/read - unknown id | 404. code = not-found. | [ ] |  |  |
| 36 | PATCH /api/citizen/alerts/:id/read - someone else's alert | 404. code = not-found. You cannot see or change another person's alert. | [ ] |  |  |
| 37 | POST /api/citizen/alerts/read-all | 200. Afterwards GET /citizen/alerts/unread-count returns 0. | [ ] |  |  |
| 38 | POST /api/citizen/reports/:id/reopen - resolved report | 200. data.verification = reopened, data.priority = reopened, data.status = resolved. | [ ] |  |  |
| 39 | POST /api/citizen/reports/:id/reopen - second click | 409. code = conflict (already reopened). | [ ] |  |  |
| 40 | POST /api/citizen/reports/:id/reopen - open report | 409. code = conflict (only a resolved report can be reopened). | [ ] |  |  |
| 41 | POST /api/citizen/reports/:id/reopen - unknown id | 404. code = not-found. | [ ] |  |  |
| 42 | POST /api/citizen/reports/:id/reopen - department token | 403. code = forbidden. | [ ] |  |  |
| 43 | POST /api/citizen/reports/:id/reopen - no token | 401. code = unauthorized. | [ ] |  |  |
| 44 | POST /api/citizen/chat - question | 200. data.reply = a short plain answer (at most 4 sentences, at most 800 characters) about adding a photo, the category and the pin. | [ ] |  |  |
| 45 | POST /api/citizen/chat - with history | 200. data.reply mentions 60 points per report. | [ ] |  |  |
| 46 | POST /api/citizen/chat - off topic | 200. data.reply politely says it only helps with the app. No poem. | [ ] |  |  |
| 47 | POST /api/citizen/chat - empty message | 400. code = invalid, field = message. | [ ] |  |  |
| 48 | POST /api/citizen/chat - bad history | 400. code = invalid, field = history. | [ ] |  |  |
| 49 | POST /api/citizen/chat - department token | 403. code = forbidden. | [ ] |  |  |
| 50 | GET /api/department/summary/weekly | 200. data.counts has newReports, started, submitted, resolved, open, inProgress, awaiting, longestWaitingDays. data.summary is 2 or 3 plain sentences, or null if Gemini is off. | [ ] |  |  |
| 51 | GET /api/department/summary/weekly - citizen token | 403. code = forbidden. | [ ] |  |  |

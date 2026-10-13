// kind: 'dep' (department update) | 'up' (upvotes) | 'acc' (account)
// reportId links the notification to a report in myReports.js
export const initialNotifications = [
  { id: 1, kind: 'dep', title: 'Your report is now In progress', body: 'Deep pothole on Station Road. A repair crew is scheduled.', when: '2 hours ago', unread: true, reportId: 1 },
  { id: 2, kind: 'up', title: '5 new upvotes', body: 'Overflowing bins at Lake Street market is getting attention.', when: '5 hours ago', unread: true, reportId: 2 },
  { id: 3, kind: 'dep', title: 'Resolved and verified', body: 'Burst water pipe by the school gate. The admin checked the after-photo.', when: 'Yesterday', unread: true, reportId: 4 },
  { id: 4, kind: 'dep', title: 'Report reopened', body: 'Pothole on Mill Road was reopened for further inspection.', when: '2 days ago', unread: false, reportId: 3 },
  { id: 5, kind: 'acc', title: 'You have successfully signed in', body: 'Welcome back, Nadia.', when: '3 days ago', unread: false },
  { id: 6, kind: 'acc', title: 'Welcome to Babylon!', body: 'Your account was created successfully.', when: '2 weeks ago', unread: false },
]

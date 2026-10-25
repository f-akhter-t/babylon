// The name of the event this tab fires on window when a report changes. Pages
// listen to it to refresh. It lives in its own file so hooks/liveIssues.js (and
// its test) can use it without loading the mock API.
export const ISSUES_EVENT = 'babylon:issues'

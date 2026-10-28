// Whole sentences about a reopened issue. votes counts the citizens who voted
// for the new report, which was filed after the first fix, so every vote came
// after the issue was first marked resolved. t is the translate function.

// The queue card and the review panel: why the issue is in the queue.
export function reopenedSentence(issue, t) {
  return issue.votes === 1
    ? t('This issue was reopened after it was first marked resolved on {date}, and one citizen has voted for it since.', { date: issue.reopenedFrom })
    : t('This issue was reopened after it was first marked resolved on {date}, and {n} citizens have voted for it since.', { date: issue.reopenedFrom, n: issue.votes })
}

// The Reopened list.
export function votesSinceSentence(issue, t) {
  return issue.votes === 1
    ? t('One citizen has voted for it since it came back.')
    : t('{n} citizens have voted for it since it came back.', { n: issue.votes })
}

// The banner above the verification queue, after "A closed problem came back."
export function bannerSentence(issue, t) {
  return issue.votes === 1
    ? t('“{title}” was first marked resolved on {date}, and one citizen has voted for it since.', { title: issue.title, date: issue.reopenedFrom })
    : t('“{title}” was first marked resolved on {date}, and {n} citizens have voted for it since.', { title: issue.title, date: issue.reopenedFrom, n: issue.votes })
}

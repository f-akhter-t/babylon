// Whole sentences about a reopened issue. votes counts the citizens who voted
// for the new report, which was filed after the first fix, so every vote came
// after the issue was first marked resolved.

// The queue card and the review panel: why the issue is in the queue.
export function reopenedSentence(issue) {
  return issue.votes === 1
    ? `This issue was reopened after it was first marked resolved on ${issue.reopenedFrom}, and one citizen has voted for it since.`
    : `This issue was reopened after it was first marked resolved on ${issue.reopenedFrom}, and ${issue.votes} citizens have voted for it since.`
}

// The Reopened list.
export function votesSinceSentence(issue) {
  return issue.votes === 1
    ? 'One citizen has voted for it since it came back.'
    : `${issue.votes} citizens have voted for it since it came back.`
}

// The banner above the verification queue, after "A closed problem came back."
export function bannerSentence(issue) {
  return issue.votes === 1
    ? `“${issue.title}” was first marked resolved on ${issue.reopenedFrom}, and one citizen has voted for it since.`
    : `“${issue.title}” was first marked resolved on ${issue.reopenedFrom}, and ${issue.votes} citizens have voted for it since.`
}

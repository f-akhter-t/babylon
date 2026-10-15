// Why a reopened issue is in the verification queue, as one sentence.
// Shown on its queue card and in the review panel.
export function reopenedSentence(issue) {
  return issue.votes === 1
    ? `This issue was reopened because one citizen reported it again after it was first marked resolved on ${issue.reopenedFrom}.`
    : `This issue was reopened because ${issue.votes} citizens reported it again after it was first marked resolved on ${issue.reopenedFrom}.`
}

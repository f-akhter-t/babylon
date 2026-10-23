// A reason as the end of a sentence: trailing full stops and spaces trimmed,
// then one full stop, unless it already ends with ? or !.
export function reasonSentence(reason) {
  const text = String(reason).trim().replace(/[.\s]+$/, '')
  return /[?!]$/.test(text) ? text : `${text}.`
}

import bn, { patterns } from './bn'
import { serverText } from './serverText'

const BANGLA_DIGITS = '০১২৩৪৫৬৭৮৯'
const MONTHS = {
  Jan: 'জানু', Feb: 'ফেব্রু', Mar: 'মার্চ', Apr: 'এপ্রিল', May: 'মে', Jun: 'জুন',
  Jul: 'জুলাই', Aug: 'আগস্ট', Sep: 'সেপ্টেম্বর', Oct: 'অক্টোবর', Nov: 'নভেম্বর', Dec: 'ডিসেম্বর',
}

// 12 -> "১২" in Bangla, unchanged in English.
export function localizeDigits(lang, value) {
  const text = String(value)
  return lang === 'bn' ? text.replace(/\d/g, (d) => BANGLA_DIGITS[d]) : text
}

// A piece of text with no dictionary entry: a plain number ("12", "3.5") or a
// date ("12 Oct 2026") is written in Bangla. Anything else (a title, a name,
// an email) is left exactly as it is.
function numbersAndDates(text) {
  if (/^[\d\s.,:%/+-]+$/.test(text)) return localizeDigits('bn', text)
  if (/^\d{1,2} (Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)( \d{4})?$/.test(text)) {
    return localizeDigits('bn', text.replace(/ ([A-Z][a-z]{2})\b/, (match, month) => ` ${MONTHS[month]}`))
  }
  return text
}

// Server text with a number or a date inside ("3 days ago"). Each pattern
// turns the English sentence into Bangla; its parts are converted first.
function fromPattern(text) {
  for (const [regex, make] of patterns) {
    const match = text.match(regex)
    if (match) return make(...match.slice(1).map((part) => toBangla(part, true)))
  }
  return null
}

// Server sentences: whole ones are looked up, ones with {places} are matched.
const serverWhole = new Map()
const serverMatchers = []
for (const [english, bangla] of serverText) {
  if (!english.includes('{')) {
    serverWhole.set(english, bangla)
    continue
  }
  const names = []
  const source = english
    .split(/(\{\w+\})/)
    .map((part) => {
      const name = /^\{(\w+)\}$/.exec(part)?.[1]
      if (!name) return part.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
      names.push(name)
      return '(.+?)'
    })
    .join('')
  serverMatchers.push([new RegExp(`^${source}$`), names, bangla])
}

function fromServerText(text) {
  if (serverWhole.has(text)) return serverWhole.get(text)
  for (const [regex, names, bangla] of serverMatchers) {
    const match = text.match(regex)
    if (!match) continue
    const values = {}
    names.forEach((name, index) => {
      values[name] = toBangla(match[index + 1], true)
    })
    return bangla.replace(/\{(\w+)\}/g, (whole, key) => values[key] ?? whole)
  }
  return null
}

// strict = false: a whole sentence. Without an entry, it stays English.
// strict = true: a piece (a date, a name of a department). Numbers become Bangla.
function toBangla(text, piece) {
  return bn[text] ?? fromPattern(text) ?? fromServerText(text) ?? (piece ? numbersAndDates(text) : text)
}

// English text is the key. A missing entry falls back to the English text,
// so a page never shows a blank. {name} places are filled from `vars`;
// numbers in Bangla use Bangla digits.
export function translate(lang, text, vars) {
  if (typeof text !== 'string') return text
  const base = lang === 'bn' ? toBangla(text, false) : text
  if (!vars) return base
  return base.replace(/\{(\w+)\}/g, (match, key) => {
    if (!(key in vars)) return match
    return lang === 'bn' ? toBangla(String(vars[key]), true) : String(vars[key])
  })
}

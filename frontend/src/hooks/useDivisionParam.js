import { useSearchParams } from 'react-router-dom'
import { DIVISIONS } from '../utils/divisions'

// The chosen division lives in the URL (?division=Dhaka), so a tile or link on
// another page can open a list already narrowed to it. '' means all of Bangladesh.
// Returns [division, setDivision]. Other parts of the URL are kept.
export function useDivisionParam() {
  const [params, setParams] = useSearchParams()
  const raw = params.get('division')
  const division = DIVISIONS.includes(raw) ? raw : ''
  function setDivision(value) {
    const next = new URLSearchParams(params)
    if (value) next.set('division', value)
    else next.delete('division')
    setParams(next, { replace: true })
  }
  return [division, setDivision]
}

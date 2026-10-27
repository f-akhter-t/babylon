import { useT } from './useLanguage'

// For places that cannot call a hook (a class component): <Tr>Some text</Tr>.
export default function Tr({ children, vars }) {
  const t = useT()
  return t(children, vars)
}

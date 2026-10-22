import { useEffect, useState } from 'react'
import { useMap } from 'react-leaflet'

const LONGEST_WAIT = 1500 // FlyToSelected flies for 0.8 s

// False while the map is still flying to a newly selected pin, then true.
// Moving the map during the fly would make it jump, so popups wait for this.
// wait = false: true straight away (nothing is flying, e.g. a dropped pin).
export function useSettled(wait) {
  const map = useMap()
  const [settled, setSettled] = useState(!wait)

  useEffect(() => {
    if (settled) return
    const done = () => setSettled(true)
    const timer = setTimeout(done, LONGEST_WAIT) // in case no fly happens
    map.once('moveend', done)
    return () => {
      clearTimeout(timer)
      map.off('moveend', done)
    }
  }, [map, settled])

  return settled
}

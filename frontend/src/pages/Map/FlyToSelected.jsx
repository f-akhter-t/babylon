import { useEffect } from 'react'
import { useMap } from 'react-leaflet'
import { flyTo } from '../../components/ui/motion'

// Lives inside the map and draws nothing. When the selected issue changes,
// it smoothly moves the map to that issue's pin.
export default function FlyToSelected({ issue }) {
  const map = useMap()
  const lat = issue?.lat
  const lng = issue?.lng

  useEffect(() => {
    if (lat == null || lng == null) return
    flyTo(map, [lat, lng], Math.max(map.getZoom(), 16), { duration: 0.8 })
  }, [map, lat, lng])

  return null
}

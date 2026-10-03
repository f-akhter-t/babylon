// Shared by MapPopup and DropPin.
// leaflet.css beats normal Tailwind classes, so these resets use "!".
// [&_.x] means "a child with class x inside this popup".
export const POPUP_CLASSES = [
  '[&_.leaflet-popup-content-wrapper]:rounded-card!',
  '[&_.leaflet-popup-content-wrapper]:p-0!',
  '[&_.leaflet-popup-content-wrapper]:shadow-xl!',
  '[&_.leaflet-popup-content]:m-0!',
].join(' ')

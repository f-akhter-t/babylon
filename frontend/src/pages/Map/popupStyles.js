// Shared by MapPopup and DropPin.
// leaflet.css beats normal Tailwind classes, so these resets use "!".
// [&_.x] means "a child with class x inside this popup".
export const POPUP_CLASSES = [
  '[&_.leaflet-popup-content-wrapper]:rounded-card!',
  '[&_.leaflet-popup-content-wrapper]:p-0!',
  '[&_.leaflet-popup-content-wrapper]:shadow-xl!',
  '[&_.leaflet-popup-content]:m-0!',
].join(' ')

// Beside the pin: no space under the popup for Leaflet's arrow, and the arrow
// is turned to point sideways at the pin's head.
export const SIDE_CLASSES = {
  right: [
    'mb-0!',
    '[&_.leaflet-popup-tip-container]:top-5!',
    '[&_.leaflet-popup-tip-container]:-left-[29px]!',
    '[&_.leaflet-popup-tip-container]:m-0!',
    '[&_.leaflet-popup-tip-container]:rotate-90',
  ].join(' '),
  left: [
    'mb-0!',
    '[&_.leaflet-popup-tip-container]:top-5!',
    '[&_.leaflet-popup-tip-container]:left-auto!',
    '[&_.leaflet-popup-tip-container]:-right-[29px]!',
    '[&_.leaflet-popup-tip-container]:m-0!',
    '[&_.leaflet-popup-tip-container]:-rotate-90',
  ].join(' '),
}

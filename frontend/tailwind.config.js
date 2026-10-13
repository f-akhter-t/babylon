/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        navy: '#011638',
        forest: '#214E34',
        slate: '#364156',
        mint: '#E3F1E8',
        'mint-deep': '#C4E3D1',
        brand: '#5BD6A0',
        amber: '#FFB547',
        'amber-dark': '#E39F2E',
        muted: '#6B7890',
        page: '#CDCDCD',
        // two extra soft tints used by the pills in this design
        'amber-soft': '#FFE9C4',
        'slate-soft': '#E3E6EE',
        'map-land': '#F2EFE9',
        'map-park': '#CDEBC0',
        'map-water': '#AAD3DF',
      },
      fontFamily: {
        heading: ['"Bricolage Grotesque"', 'Figtree', 'sans-serif'],
        body: ['Figtree', 'system-ui', 'sans-serif'],
      },
      borderRadius: { card: '22px', panel: '24px' },
      boxShadow: {
        lift: '0 8px 20px rgba(1,22,56,.15)',
        pop: '0 12px 32px rgba(1,22,56,.28)',
        bar: '0 4px 12px rgba(1,22,56,.1)',
      },
    },
  },
  plugins: [],
}

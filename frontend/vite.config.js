import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    // The browser calls /api on this server and Vite forwards it to the Express
    // backend (backend/.env PORT, 5000 by default). No CORS, no second address.
    proxy: { '/api': 'http://localhost:5000' },
  },
  build: {
    rolldownOptions: {
      output: {
        // The two big libraries get chunks of their own, loaded only by the
        // pages that use them: Leaflet for the maps, recharts for Accountability.
        codeSplitting: {
          // Only the matched packages: without this, React would be pulled into
          // the leaflet chunk and every page would have to load it.
          includeDependenciesRecursively: false,
          groups: [
            { name: 'leaflet', test: /node_modules[\\/](leaflet|react-leaflet|@react-leaflet)[\\/]/ },
            {
              name: 'recharts',
              test: /node_modules[\\/](recharts|d3-[^\\/]+|victory-vendor|internmap|decimal\.js-light|eventemitter3|react-redux|@reduxjs|redux|redux-thunk|reselect|immer|es-toolkit|tiny-invariant|use-sync-external-store)[\\/]/,
            },
          ],
        },
      },
    },
  },
})

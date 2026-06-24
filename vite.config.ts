import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    host: '0.0.0.0', // Listen on all network interfaces
    port: 5173,
    strictPort: false
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            // Group heavy Three.js assets together
            if (id.includes('three')) {
              return 'vendor-three';
            }
            // Group Mapbox / Maplibre mapping layers together
            if (id.includes('mapbox-gl') || id.includes('maplibre-gl')) {
              return 'vendor-maps';
            }
            // Group GSAP animation assets together
            if (id.includes('gsap')) {
              return 'vendor-gsap';
            }
            // Group general core vendor libraries
            return 'vendor-core';
          }
        }
      }
    }
  }
});

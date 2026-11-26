import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: './',
  // Sin pre-empaquetar, MapLibre encuentra su worker junto a su propio archivo en dev
  optimizeDeps: { exclude: ['maplibre-gl'] },
});

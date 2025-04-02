import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import svgr from 'vite-plugin-svgr'; // Import SVGR plugin

// https://vite.dev/config/
export default defineConfig({
  base: '/bitcoin-tracker/',
  plugins: [react(), svgr()],
});

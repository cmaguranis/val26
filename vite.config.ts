import path from "path"
import tailwindcss from "@tailwindcss/vite"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  // Set base to your repository name for GitHub Pages
  // Example: if repo is 'username/my-repo', set base to '/my-repo/'
  // For custom domain or username.github.io, set base to '/'
  base: './', // Relative paths work for most GitHub Pages setups
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // Split vendor code
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'three-vendor': ['three', '@react-three/fiber', '@react-three/drei'],
          // Split game components
          'game-invisible-heart': ['./src/games/invisible-heart.tsx'],
          'game-unwrapped-uv': ['./src/games/unwrapped-uv.tsx'],
          'game-museum-guard': ['./src/games/museum-guard.tsx'],
        }
      }
    },
    // Increase chunk size warning limit since we're splitting
    chunkSizeWarningLimit: 600,
  }
})

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
})

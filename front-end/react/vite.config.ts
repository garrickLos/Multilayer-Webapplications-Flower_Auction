import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
    plugins: [react()],
    server: {
        port: 5174,
        proxy: {
            "/api": {
                target: "http://localhost:5105",
                changeOrigin: true,
                // Laat het pad intact zodat /api/* via de proxy wordt doorgestuurd.
                rewrite: (path) => path,
            },
            "/auth": {
                target: "http://localhost:5105",
                changeOrigin: true,
            },
        },
    },
})

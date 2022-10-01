import { defineConfig } from 'vite'

// https://vitejs.dev/config/
export default defineConfig({
    server: {
        port: 8080
    },
    build: {
        lib: {
            entry: 'index.html',
            formats: ['es']
        },
        rollupOptions: {
            //external: /^lit/
        }
    }
})

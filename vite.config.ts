import { defineConfig } from 'vite'

// https://vitejs.dev/config/
export default defineConfig({
    server: {
        port: 8080
    },
    build: {
        lib: {
            entry: 'src/app.ts',
            formats: ['es']
        },
        rollupOptions: {
            //external: /^lit/
        }
    }
})

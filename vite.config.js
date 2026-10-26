import {
    defineConfig
} from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
    plugins: [react()],
    esbuild: {
        loader: 'jsx',
        include: /src\/front\/.*\.[jt]sx?$/,
        exclude: []
    },
    server: {
        port: 3000,
        proxy: {
            '/api': {
                target: 'http://127.0.0.1:3001',
                changeOrigin: true
            }
        }
    },
    build: {
        outDir: 'dist',
        rollupOptions: {
            input: {
                main: 'index.html',
                guitars: 'guitarras.html',
                pianos: 'pianos.html',
                checkout: 'pago.html'
            }
        }
    }
})
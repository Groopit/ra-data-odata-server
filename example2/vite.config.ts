import {defineConfig} from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path';
// https://vitejs.dev/config/
export default defineConfig({
    server: {
        open:true,
        proxy: {
            "/V4": {
                target: "https://services.odata.org",
                changeOrigin: true
            }
        }
    },
    resolve: {
        alias: {"ra-data-odata-server": path.resolve(__dirname,"../dist")}
    },
    plugins: [react()],
})

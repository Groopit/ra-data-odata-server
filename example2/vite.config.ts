import {defineConfig} from 'vite'
import react from '@vitejs/plugin-react'

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
        alias: {"ra-data-odata-server": "/Users/remcoblumink/RiderProjects/ra-data-odata-server/dist"}
    },
    plugins: [react()],
})

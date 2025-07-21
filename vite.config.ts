  import { defineConfig } from 'vite';
  import react from '@vitejs/plugin-react';

  // https://vitejs.dev/config/
  export default defineConfig({
    plugins: [react()],
    optimizeDeps: {
      exclude: ['lucide-react'],
    },
    server: {
      port: 5173,
      strictPort: false,
      host: true,
      allowedHosts: [
        // Add your Replit host here, copy from the error message
        "c648bfd1-6994-4742-be02-5d32e01a1b58-00-1owcn2te8rduv.riker.replit.dev",
        // Add your current ngrok host
        "7212662aca17.ngrok-free.app"
      ]
    }
  });

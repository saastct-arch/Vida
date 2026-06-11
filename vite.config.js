import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Configuração do Vite para o projeto NEXUS (React + Vite)
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    // Em desenvolvimento, encaminha as chamadas /api para a função serverless
    // local caso esteja rodando o `vercel dev`. Em produção a Vercel resolve /api.
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    // Separa as bibliotecas pesadas em chunks para melhorar o carregamento
    rollupOptions: {
      output: {
        manualChunks: {
          react: ['react', 'react-dom', 'react-router-dom'],
          charts: ['recharts'],
          supabase: ['@supabase/supabase-js'],
        },
      },
    },
  },
})

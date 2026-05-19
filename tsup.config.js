import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['lib/index.js'],
  format: ['cjs', 'esm'],
  clean: true,
  external: ['react', 'react-dom', 'next'],
  outDir: 'dist',
  sourcemap: true,
})
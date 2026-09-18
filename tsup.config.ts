import { defineConfig } from 'tsup';
import path from 'path';

export default defineConfig({
  entry: ['src/main.ts'],
  outDir: 'dist',
  format: ['cjs'],
  clean: true,
  sourcemap: true,
  esbuildOptions(options) {
    options.alias = {
      '@': path.resolve(__dirname, 'src'),
    };
  },
});

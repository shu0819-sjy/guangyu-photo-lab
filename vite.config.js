import { defineConfig } from 'vite';

const repositoryName = 'guangyu-photo-lab';
const basePath = process.env.GITHUB_ACTIONS === 'true' ? `/${repositoryName}/` : '/';

export default defineConfig({
  base: basePath,
  build: {
    sourcemap: false
  }
});

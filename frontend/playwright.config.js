// playwright.config.js
import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests', // Look for tests in the 'tests' directory
  use: {
    baseURL: 'http://localhost:5178',
  },
});

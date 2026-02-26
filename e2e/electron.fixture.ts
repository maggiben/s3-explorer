import { test as base } from '@playwright/test';
import path from 'path';
import { _electron as electron } from 'playwright';
import type { ElectronApplication } from 'playwright';

type ElectronFixtures = {
  electronApp: ElectronApplication;
};

/**
 * Fixture that launches the built Electron app for E2E tests.
 * Requires: pnpm run build (so that out/main/index.js exists).
 */
export const test = base.extend<ElectronFixtures>({
  electronApp: async ({}, use) => {
    const mainPath = path.join(process.cwd(), 'out', 'main', 'index.js');
    const args = process.env.CI ? ['--no-sandbox', mainPath] : [mainPath];
    const electronApp = await electron.launch({
      args,
      cwd: process.cwd(),
      timeout: 30_000,
    });
    await use(electronApp);
    await electronApp.close();
  },
});

export { expect } from '@playwright/test';

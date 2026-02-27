import { test as base } from '@playwright/test';
import path from 'path';
import { _electron as electron } from 'playwright';
import type { ElectronApplication } from 'playwright';

type ElectronFixtures = {
  electronApp: ElectronApplication;
};

/**
 * Fixture that launches the built Electron app for E2E tests.
 * Requires: npm run build (so that out/main/index.js exists).
 */
export const test = base.extend<ElectronFixtures>({
  // eslint-disable-next-line no-empty-pattern -- Playwright requires object destructuring; this fixture uses no other fixtures
  electronApp: async ({}, runWith) => {
    const mainPath = path.join(process.cwd(), 'out', 'main', 'index.js');
    const isCI = !!process.env.CI;
    const args = isCI ? ['--no-sandbox', '--disable-setuid-sandbox', mainPath] : [mainPath];
    const env = isCI ? { ...process.env, CHROME_DEVEL_SANDBOX: '' } : undefined;
    const electronApp = await electron.launch({
      args,
      cwd: process.cwd(),
      timeout: 30_000,
      ...(env && { env }),
    });
    await runWith(electronApp);
    await electronApp.close();
  },
});

export { expect } from '@playwright/test';

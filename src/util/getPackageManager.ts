import appRootPath from 'app-root-path';
import { detect as detectPackageManager } from 'detect-package-manager';

/**
 * Detects the active package manager for the momorepo where this command is run.
 * Defaults to 'npm' if detection fails.
 */
export async function getPackageManager(monorepoRoot = appRootPath.toString()) {
  const which = await detectPackageManager({ cwd: monorepoRoot });

  return which ?? 'npm';
}

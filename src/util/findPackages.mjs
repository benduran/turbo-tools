/**
 * @typedef {import('type-fest').PackageJson} PackageJson
 */

import mapWorkspaces from '@npmcli/map-workspaces';
import appRootPath from 'app-root-path';
import fs from 'fs-extra';
import path from 'path';

import { execFromDir } from './childProcess.mjs';
import { getPackageManager } from './getPackageManager.mjs';

/**
 * Grabs all the workspaces from the monorepo root
 */
export async function findPackages(monorepoRoot = appRootPath.toString()) {
  const whichPM = await getPackageManager(monorepoRoot);
  const rootPJSON = JSON.parse(await fs.readFile(path.join(monorepoRoot, 'package.json'), 'utf8'));

  /** @type {Map<string, string>} */
  let workspaces;

  if (whichPM === 'pnpm') {
    // this will also include the ROOT workspace, which we need to manually exclude
    /** @type {Array<{ name: string; path: string; private: boolean; version: string }>} */
    const foundPnpmWorkspaces = JSON.parse(
      execFromDir({
        args: ['list', '-r', '--depth', '-1', '--json'],
        cmd: 'pnpm',
        cwd: monorepoRoot,
        stdio: 'pipe',
      }),
    );
    workspaces = new Map(foundPnpmWorkspaces.filter(w => w.name !== rootPJSON.name).map(w => [w.name, w.path]));
  } else {
    // yarn and npm use the same "workspaces" field in the package.json,
    // so we can rely on the npmcli detection algo
    workspaces = await mapWorkspaces({
      cwd: monorepoRoot,
      pkg: rootPJSON,
    });
  }

  const packages = await Promise.all(
    Array.from(workspaces.entries()).map(async ([name, packagePath]) => {
      /** @type {PackageJson} */
      const pjson = JSON.parse(await fs.readFile(path.join(packagePath, 'package.json'), 'utf8'));
      return {
        isPrivate: pjson.private ?? false,
        name,
        packagePath,
        packageJSONPath: path.join(packagePath, 'package.json'),
        pkg: pjson,
        version: pjson.version,
      };
    }),
  );

  return packages.sort((a, b) => a.name.localeCompare(b.name));
}

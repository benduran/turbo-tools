import mapWorkspaces from '@npmcli/map-workspaces';
import appRootPath from 'app-root-path';
import fs from 'fs-extra';
import path from 'path';
import { PackageJson } from 'type-fest';

import { execFromDir } from './childProcess';
import { getPackageManager } from './getPackageManager';

/**
 * Grabs all the workspaces from the monorepo root
 */
export async function findPackages(monorepoRoot = appRootPath.toString()) {
  const whichPM = await getPackageManager(monorepoRoot);
  const rootPJSON = JSON.parse(await fs.readFile(path.join(monorepoRoot, 'package.json'), 'utf8'));

  let workspaces: Map<string, string>;

  if (whichPM === 'pnpm') {
    // this will also include the ROOT workspace, which we need to manually exclude
    const foundPnpmWorkspaces = JSON.parse(
      execFromDir({
        args: ['list', '-r', '--depth', '-1', '--json'],
        cmd: 'pnpm',
        cwd: monorepoRoot,
        stdio: 'pipe',
      }),
    ) as Array<{ name: string; path: string; private: boolean; version: string }>;
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
      const pjson = JSON.parse(await fs.readFile(path.join(packagePath, 'package.json'), 'utf8')) as PackageJson;
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

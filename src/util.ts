import mapWorkspaces from '@npmcli/map-workspaces';
import appRootPath from 'app-root-path';
import { execSync } from 'child_process';
import { detect as detectPackageManager } from 'detect-package-manager';
import fs from 'fs-extra';
import path from 'path';
import type { PackageJson } from 'type-fest';
import type yargs from 'yargs';

interface ExecFromRootOptions {
  args: string[];
  cmd: string;
  cwd: string;
  stdio: 'inherit' | 'pipe';
}

/**
 * Executes a command asynchronously from a specific dir
 */
export function execSyncFromDir({ args, cmd, cwd, stdio }: ExecFromRootOptions) {
  console.info(`\nExecuting ${cmd} ${args.join(' ')} in ${cwd}\n`);
  return execSync(`${cmd} ${args.join(' ')}`, { cwd, stdio });
}

/**
 * Executes a command asynchronously in the root of the project a.k.a. the monorepo root
 */
export function execSyncFromRoot(args: Omit<ExecFromRootOptions, 'cwd'>) {
  return execSyncFromDir({ ...args, cwd: appRootPath.toString() });
}

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
      execSyncFromDir({
        args: ['list', '-r', '--depth', '-1', '--json'],
        cmd: 'pnpm',
        cwd: monorepoRoot,
        stdio: 'pipe',
      }).toString('utf-8'),
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

type TurboJson = Partial<Record<'@schema', string>> &
  Partial<
    Record<
      'pipeline',
      Record<
        string,
        {
          cache?: boolean;
          dependsOn?: string[];
          inputs?: string[];
          outputMode?: 'full' | 'hash-only' | 'new-only' | 'none';
          outputs?: string[];
        }
      >
    >
  >;

/**
 * Utility function that performs checks to determine
 * if turbo was installed correctly, and if a proper "turbo.json"
 * file exists, that it has "lint," "test," and "build" commands
 */
export async function guardTurboExists() {
  try {
    execSyncFromRoot({ cmd: 'npx', args: ['turbo', '--help'], stdio: 'pipe' });
  } catch (error) {
    /* if we get here, turbo does NOT exist */
    console.error('turbo has not been installed. unable to use the turbo-tools');
    return false;
  }
  const turboJsonPath = path.join(appRootPath.toString(), 'turbo.json');
  try {
    const turboJsonStat = await fs.stat(turboJsonPath);
    if (!turboJsonStat.isFile()) throw new Error('turbo.json is missing');
  } catch (error) {
    /* turbo.json is missing */
    console.error('turbo.json is missing. unable to use the turbo-tools');
    return false;
  }
  const turboJsonContents = JSON.parse(await fs.readFile(turboJsonPath, 'utf8')) as TurboJson;
  if (!turboJsonContents.pipeline?.build) {
    console.error('turbo.json is missing a "build" pipeline. unable to use the turbo-tools');
    return false;
  }
  if (!turboJsonContents.pipeline?.lint) {
    console.error('turbo.json is missing a "lint" pipeline. unable to use the turbo-tools');
    return false;
  }
  if (!turboJsonContents.pipeline?.test) {
    console.error('turbo.json is missing a "test" pipeline. unable to use the turbo-tools');
    return false;
  }
  return true;
}

/**
 * Utility Yargs function to be used between the Publish and Version CLI commands.
 * Maps a shared, baseline set of CLI args between both
 */
export function getVersionAndPublishBaseYargs(yargs: yargs.Argv) {
  return yargs
    .option('all', {
      alias: 'a',
      default: false,
      description:
        'If true, dirties all monorepo packages and thus, forces them all to be version bumped and published',
      type: 'boolean',
    })
    .option('dryRun', {
      alias: 'd',
      default: false,
      description:
        'If true, will perform all steps right up until publish, and then output what would happen if publish were to continue',
      type: 'boolean',
    })
    .option('releaseAs', {
      description:
        'Releases each changed package as this release type or as an exact version. "major" "minor" "patch" "alpha" "beta" or an exact semver version number are allowed.',
      type: 'string',
    })
    .option('yes', {
      alias: 'y',
      default: false,
      description: 'If true, bypasses any prompts',
      type: 'boolean',
    });
}

/**
 * Determines the release tag to use before publishing to NPM
 */
export function determinePublishTag(releaseAs?: string) {
  return releaseAs === 'alpha' || releaseAs === 'beta' ? releaseAs : '';
}

/**
 * Performs version bumps across all registered packages with Lerna's "version" command
 */
export async function versionWithLerna({
  all,
  dryRun,
  releaseAs,
  publishTag,
  willPublish,
  yes,
}: {
  all: boolean;
  dryRun: boolean;
  releaseAs?: 'major' | 'minor' | 'patch' | 'alpha' | 'beta' | string;
  publishTag: 'alpha' | 'beta' | '';
  willPublish: boolean;
  yes: boolean;
}) {
  const versionCmd = 'npx';
  const versionArgs = [
    'lerna',
    'version',
    '--conventional-commits',
    '--force-git-tag',
    '--no-commit-hooks',
    '--no-push',
  ];
  const isPrerelease = releaseAs === 'alpha' || releaseAs === 'beta';
  if (publishTag) {
    const currentCommitHash = execSyncFromRoot({
      args: ['rev-parse', '--short', 'HEAD'],
      cmd: 'git',
      stdio: 'pipe',
    })
      .toString('utf8')
      .trim();
    // add the current commit hash to ensure uniqueness when handling prerelease versions
    versionArgs.push('--preid', `"${publishTag}-${currentCommitHash}"`);
  }
  if (yes) versionArgs.push('--yes');
  if (dryRun) versionArgs.push('--no-push');

  let lernaWillCommit = true;
  if (releaseAs) {
    versionArgs.push(isPrerelease ? 'prerelease' : releaseAs);
    if (isPrerelease) {
      versionArgs.push('--no-changelog');
      versionArgs.push('--no-git-tag-version');
      lernaWillCommit = false;
    }
  }

  let gitResetDirtyToThisPoint = '';
  if (all) {
    const versionedAt = new Date().toISOString();
    // need to dirty every package.json file
    const packages = await findPackages();
    await Promise.all(
      packages.map(async p => {
        const pjsonPath = path.join(p.packagePath, 'package.json');
        const pjson = JSON.parse(await fs.readFile(pjsonPath, 'utf8'));
        await fs.writeFile(pjsonPath, JSON.stringify({ ...pjson, versionedAt }, null, 2), 'utf8');
      }),
    );
    execSyncFromRoot({
      args: ['add', '.'],
      cmd: 'git',
      stdio: 'inherit',
    });
    execSyncFromRoot({
      args: ['commit', '-m', '"Force bump all"', '--no-verify'],
      cmd: 'git',
      stdio: 'inherit',
    });

    gitResetDirtyToThisPoint = execSyncFromRoot({
      args: ['rev-parse', 'HEAD^1'],
      cmd: 'git',
      stdio: 'pipe',
    }).toString('utf-8');
  }

  // lerna was GREAT at version bumping, so we'll just let it continue to do that
  execSyncFromRoot({ args: versionArgs, cmd: versionCmd, stdio: 'inherit' });

  // lerna didn't push, so we'll now amend the previous commit with the results
  // from running npm install, pnpm install or yarn install
  const lastCommitMessage = execSyncFromRoot({
    args: ['--no-pager', 'log', '--format=%B', '-n', '1'],
    cmd: 'git',
    stdio: 'pipe',
  }).toString('utf-8');

  const pm = await getPackageManager();

  execSyncFromRoot({
    args: ['install'],
    cmd: pm,
    stdio: 'inherit',
  });

  execSyncFromRoot({
    args: ['add', '.'],
    cmd: 'git',
    stdio: 'inherit',
  });

  // If lerna isn't committing, neither are we.
  // this likely means a user triggered only a prerelease version operation
  if (lernaWillCommit) {
    execSyncFromRoot({
      args: ['commit', '--amend', '-m', `"${lastCommitMessage}"`, '--no-verify'],
      cmd: 'git',
      stdio: 'inherit',
    });

    if (!dryRun) {
      execSyncFromRoot({
        args: ['push'],
        cmd: 'git',
        stdio: 'inherit',
      });
      execSyncFromRoot({
        args: ['push', '--tags'],
        cmd: 'git',
        stdio: 'inherit',
      });
    }
  }

  // reset any non-committed changes for a clean working directory
  if (!willPublish) execSyncFromRoot({ args: ['checkout', '.'], cmd: 'git', stdio: 'inherit' });
  if (dryRun) {
    if (gitResetDirtyToThisPoint) {
      execSyncFromRoot({
        args: ['reset', '--hard', gitResetDirtyToThisPoint],
        cmd: 'git',
        stdio: 'inherit',
      });
    }
  }
}

/**
 * Detects the default branch where all PRs and branches are merged.
 * Useful when initializing a repo with the turbo-tools
 */
export function getDefaultGitBranch(cwd: string) {
  try {
    const out = execSyncFromDir({
      args: ['symbolic-ref', 'refs/remotes/origin/HEAD'],
      cmd: 'git',
      cwd,
      stdio: 'pipe',
    }).toString('utf8');

    const splitOut = out.split('/');

    return (splitOut[splitOut.length - 1] ?? 'master').replace(/\s/gm, '');
  } catch (error) {
    console.error('Unable to detect the default git branch. Falling back to master');
    console.error(error);
    return 'master';
  }
}

/**
 * Detects the active package manager for the momorepo where this command is run.
 * Defaults to 'npm' if detection fails.
 */
export async function getPackageManager(monorepoRoot = appRootPath.toString()) {
  const which = (await detectPackageManager({ cwd: monorepoRoot })) ?? 'npm';
  return which;
}

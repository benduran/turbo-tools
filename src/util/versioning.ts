import fs from 'fs-extra';
import path from 'path';

import { execFromRoot } from './childProcess';
import { findPackages } from './findPackages';
import { getPackageManager } from './getPackageManager';
import { getLocalGitTags } from './git';

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
  forceTags,
  releaseAs,
  publishTag,
  willPublish,
  yes,
}: {
  all: boolean;
  dryRun: boolean;
  forceTags: boolean;
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
    const currentCommitHash = execFromRoot({
      args: ['rev-parse', '--short', 'HEAD'],
      cmd: 'git',
      stdio: 'pipe',
    });
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
    execFromRoot({
      args: ['add', '.'],
      cmd: 'git',
      stdio: 'inherit',
    });
    execFromRoot({
      args: ['commit', '-m', '"Force bump all"', '--no-verify'],
      cmd: 'git',
      stdio: 'inherit',
    });

    gitResetDirtyToThisPoint = execFromRoot({
      args: ['rev-parse', 'HEAD^1'],
      cmd: 'git',
      stdio: 'pipe',
    });
  }

  // lerna was GREAT at version bumping, so we'll just let it continue to do that
  execFromRoot({ args: versionArgs, cmd: versionCmd, stdio: 'inherit' });

  // lerna didn't push, so we'll now amend the previous commit with the results
  // from running npm install, pnpm install or yarn install
  const lastCommitMessage = execFromRoot({
    args: ['--no-pager', 'log', '--format=%B', '-n', '1'],
    cmd: 'git',
    stdio: 'pipe',
  });

  const pm = await getPackageManager();

  execFromRoot({
    args: ['install'],
    cmd: pm,
    stdio: 'inherit',
  });

  // If lerna isn't committing, neither are we.
  // this likely means a user triggered only a prerelease version operation
  if (lernaWillCommit) {
    execFromRoot({
      args: ['add', '.'],
      cmd: 'git',
      stdio: 'inherit',
    });

    execFromRoot({
      args: ['commit', '--amend', '-m', `"${lastCommitMessage}"`, '--no-verify'],
      cmd: 'git',
      stdio: 'inherit',
    });

    if (!dryRun) {
      execFromRoot({
        args: ['push'],
        cmd: 'git',
        stdio: 'inherit',
      });
      if (forceTags) {
        // force push all tags to upstream, regardless if they're new or not
        execFromRoot({
          args: ['push', '--tags', '-f'],
          cmd: 'git',
          stdio: 'inherit',
        });
      } else {
        // only push newly-created tags
        const localTagsOnly = await getLocalGitTags();
        for (const tag of localTagsOnly) {
          execFromRoot({
            args: ['push', 'origin', tag],
            cmd: 'git',
            stdio: 'inherit',
          });
        }
      }
    }
  }

  // reset any non-committed changes for a clean working directory
  if (!willPublish) execFromRoot({ args: ['checkout', '.'], cmd: 'git', stdio: 'inherit' });
  if (dryRun) {
    if (gitResetDirtyToThisPoint) {
      execFromRoot({
        args: ['reset', '--hard', gitResetDirtyToThisPoint],
        cmd: 'git',
        stdio: 'inherit',
      });
    }
  }
}

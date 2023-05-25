import os from 'os';
import path from 'path';

import { execFromDir, execFromRoot } from './childProcess';

/**
 * Determines which git tags only exist locally.
 * Useful for preventing errors pushing tags to upstream
 * that already exist
 */
export async function getLocalGitTags() {
  const allRemoteTags = (
    await execFromRoot({
      args: ['ls-remote', '--tags', 'origin'],
      cmd: 'git',
      stdio: 'pipe',
    })
  ).stdout
    .split(os.EOL)
    .filter(Boolean)
    .map(t => {
      const [sha = '', ref = ''] = t.split(/\s+/);

      return { name: path.basename(ref), sha };
    });

  // this includes the possible refs/tags prefix (or whichever else custom prefix a user may have setup)
  const allRemoteTagsSet = new Set(allRemoteTags.map(t => t.name));

  const localTags = (
    await execFromRoot({
      args: ['--no-pager', 'tag'],
      cmd: 'git',
      stdio: 'pipe',
    })
  ).stdout
    .split(os.EOL)
    .filter(Boolean)
    .map(t => path.basename(t));

  return localTags.filter(t => !allRemoteTagsSet.has(t));
}

/**
 * Detects the default branch where all PRs and branches are merged.
 * Useful when initializing a repo with the turbo-tools
 */
export async function getDefaultGitBranch(cwd: string) {
  try {
    const { stdout } = await execFromDir({
      args: ['symbolic-ref', 'refs/remotes/origin/HEAD'],
      cmd: 'git',
      cwd,
      stdio: 'pipe',
    });

    const splitOut = stdout.split('/');

    return (splitOut[splitOut.length - 1] ?? 'master').replace(/\s/gm, '');
  } catch (error) {
    console.error('Unable to detect the default git branch. Falling back to master');
    console.error(error);
    return 'master';
  }
}

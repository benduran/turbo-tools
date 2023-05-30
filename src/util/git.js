import os from 'os';

import { execFromDir, execFromRoot } from './childProcess.js';

/**
 * Determines which git tags only exist locally.
 * Useful for preventing errors pushing tags to upstream
 * that already exist
 */
export async function getLocalGitTags() {
  const allRemoteTags = execFromRoot({
    args: ['ls-remote', '--tags', 'origin'],
    cmd: 'git',
    stdio: 'pipe',
  })
    .split(os.EOL)
    .filter(Boolean)
    .map(t => {
      const [sha = '', ref = ''] = t.split(/\s+/);

      // if folks are using a different tag parent, then that's nonstandard
      return { name: ref.replace('refs/tags/', ''), sha };
    });

  // this includes the possible refs/tags prefix (or whichever else custom prefix a user may have setup)
  const allRemoteTagsSet = new Set(allRemoteTags.map(t => t.name));

  const localTags = execFromRoot({
    args: ['--no-pager', 'tag'],
    cmd: 'git',
    stdio: 'pipe',
  })
    .split(os.EOL)
    .filter(Boolean);

  return localTags.filter(t => !allRemoteTagsSet.has(t));
}

/**
 * Detects the default branch where all PRs and branches are merged.
 * Useful when initializing a repo with the turbo-tools
 *
 * @param {string} cwd
 */
export async function getDefaultGitBranch(cwd) {
  try {
    const stdout = execFromDir({
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

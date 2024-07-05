import { ReleaseAsPresets } from '@better-builds/lets-version';
import type { Argv } from 'yargs';

import { getVersionAndPublishBaseYargs, versionWithLetsVersion } from '../util/index.js';

/**
 * This performs only version bumps of packages in your monorepo
 */
export async function version(yargs: Argv) {
  const {
    all: __deprecatedAll,
    allowUncommitted,
    dryRun,
    force,
    noChangelog,
    noCommit,
    noFetchAll,
    noFetchTags,
    noPush,
    package: names,
    releaseAs,
    rollupChangelog,
    uniqify,
    saveExact,
    updateOptional,
    updatePeer,
    yes,
  } = await getVersionAndPublishBaseYargs(yargs).help().argv;

  const success = await versionWithLetsVersion({
    allowUncommitted,
    dryRun,
    force: __deprecatedAll ?? force,
    names: (names ?? []).map(String),
    noChangelog,
    noCommit,
    noFetchAll,
    noFetchTags,
    noPush,
    releaseAs: releaseAs as ReleaseAsPresets,
    rollupChangelog,
    uniqify,
    saveExact,
    updateOptional,
    updatePeer,
    yes,
  });

  console.info(success ? 'Sucessfully bumped versions' : 'Version bumps were aborted');
}

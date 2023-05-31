/**
 * @typedef {import('yargs').Argv} Argv
 */

import { getVersionAndPublishBaseYargs, versionWithLetsVersion } from '../util/index.js';

/**
 * This performs only version bumps of packages in your monorepo
 * @param {Argv} yargs
 */
export async function version(yargs) {
  const { all, dryRun, noFetchAll, noFetchTags, releaseAs, yes } = await getVersionAndPublishBaseYargs(yargs).help()
    .argv;

  const success = await versionWithLetsVersion({
    all,
    dryRun,
    forceTags: !noFetchTags,
    noFetchAll,
    releaseAs,
    willPublish: false,
    yes,
  });

  console.info(success ? 'Sucessfully bumped versions' : 'Version bumps were aborted');
}
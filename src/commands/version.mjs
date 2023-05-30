/**
 * @typedef {import('yargs').Argv} Argv
 */

import { getVersionAndPublishBaseYargs, versionWithLetsVersion } from '../util/index.mjs';

/**
 * This performs only version bumps of packages in your monorepo
 * @param {Argv} yargs
 */
export async function version(yargs) {
  const { all, dryRun, noFetchTags, releaseAs, yes } = await getVersionAndPublishBaseYargs(yargs).help().argv;

  await versionWithLetsVersion({
    all,
    dryRun,
    forceTags: !noFetchTags,
    releaseAs,
    willPublish: false,
    yes,
  });
}

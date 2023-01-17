import type yargs from 'yargs';

import { determinePublishTag, getVersionAndPublishBaseYargs, versionWithLerna } from '../util';

/**
 * This performs only version bumps of packages in your monorepo
 */
export async function version(yargs: yargs.Argv) {
  const { all, dryRun, releaseAs, yes } = await getVersionAndPublishBaseYargs(yargs).help().argv;

  const publishTag = determinePublishTag(releaseAs);

  await versionWithLerna({
    all,
    dryRun,
    releaseAs,
    publishTag,
    willPublish: false,
    yes,
  });
}

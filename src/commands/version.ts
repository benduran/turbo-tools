import type yargs from 'yargs';

import { getVersionAndPublishBaseYargs, versionWithLetsVersion } from '../util';

/**
 * This performs only version bumps of packages in your monorepo
 */
export async function version(yargs: yargs.Argv) {
  const { all, dryRun, noFetchTags, releaseAs, yes } = await getVersionAndPublishBaseYargs(yargs).help().argv;

  await versionWithLetsVersion({
    all,
    dryRun,
    forceTags: !noFetchTags,
    publishTag: '',
    releaseAs,
    willPublish: false,
    yes,
  });

  // const publishTag = determinePublishTag(releaseAs);

  // await versionWithLerna({
  //   all,
  //   dryRun,
  //   forceTags, // we will overload this property to prevent changing API surface area everywhere
  //   releaseAs,
  //   publishTag,
  //   willPublish: false,
  //   yes,
  // });
}

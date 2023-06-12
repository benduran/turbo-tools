/**
 * @typedef {import('@better-builds/lets-version').ChangeLogLineFormatter} ChangeLogLineFormatter
 */

import { applyRecommendedBumpsByPackage } from '@better-builds/lets-version';

/**
 * Determines the release tag to use before publishing to NPM
 *
 * @param {string} [releaseAs]
 */
export function determinePublishTag(releaseAs) {
  return releaseAs === 'alpha' || releaseAs === 'beta' ? releaseAs : '';
}

/**
 * @typedef {Object} VersionOpts
 * @property {boolean} all
 * @property {boolean} dryRun
 * @property {boolean} noFetchAll
 * @property {boolean} forceTags
 * @property {'major' | 'minor' | 'patch' | 'alpha' | 'beta' | string} [releaseAs]
 * @property {boolean} willPublish
 * @property {boolean} yes
 * @property {boolean} uniqify
 * @property {ChangeLogLineFormatter=} changelogLineFormatter
 */

/**
 * @param {VersionOpts} opts
 */
export async function versionWithLetsVersion(opts) {
  const result = await applyRecommendedBumpsByPackage(
    undefined,
    opts.releaseAs,
    undefined,
    opts.uniqify,
    opts.all,
    opts.noFetchAll,
    opts.forceTags,
    {
      yes: opts.yes,
      dryRun: opts.dryRun,
      changelogLineFormatter: opts.changelogLineFormatter,
    },
  );

  return Boolean(result?.bumps.length);
}

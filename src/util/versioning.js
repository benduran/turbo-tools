/**
 * @typedef {import('@better-builds/lets-version').ChangeLogLineFormatter} ChangeLogLineFormatter
 * @typedef {import('../config.js').TurboToolsConfig} TurboToolsConfig
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
 * @property {TurboToolsConfig | null} [customConfig]
 * @property {boolean} dryRun
 * @property {boolean} noFetchAll
 * @property {boolean} noFetchTags
 * @property {'major' | 'minor' | 'patch' | 'alpha' | 'beta' | string} [releaseAs]
 * @property {boolean} yes
 * @property {boolean} uniqify
 */

/**
 * @param {VersionOpts} opts
 */
export async function versionWithLetsVersion(opts) {
  const { all, customConfig, dryRun, noFetchAll, releaseAs, uniqify, yes } = opts;

  const result = await applyRecommendedBumpsByPackage({
    customConfig: customConfig?.letsVersion,
    dryRun,
    noFetchAll,
    forceAll: all,
    releaseAs,
    uniqify,
    yes,
  });

  return Boolean(result?.bumps.length);
}

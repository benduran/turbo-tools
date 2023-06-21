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
 * @property {boolean} allowUncommitted
 * @property {TurboToolsConfig | null} [customConfig]
 * @property {boolean} dryRun
 * @property {boolean} noFetchAll
 * @property {boolean} noFetchTags
 * @property {'major' | 'minor' | 'patch' | 'alpha' | 'beta' | string} [releaseAs]
 * @property {boolean} [rollupChangelog=false]
 * @property {boolean} yes
 * @property {boolean} uniqify
 * @property {boolean} updateOptional
 * @property {boolean} updatePeer
 */

/**
 * @param {VersionOpts} opts
 */
export async function versionWithLetsVersion(opts) {
  const {
    all,
    allowUncommitted,
    customConfig,
    dryRun,
    noFetchAll,
    releaseAs,
    rollupChangelog,
    uniqify,
    updateOptional,
    updatePeer,
    yes,
  } = opts;

  const result = await applyRecommendedBumpsByPackage({
    allowUncommitted,
    customConfig: customConfig?.version,
    dryRun,
    noFetchAll,
    forceAll: all,
    releaseAs,
    rollupChangelog,
    uniqify,
    updateOptional,
    updatePeer,
    yes,
  });

  return Boolean(result?.bumps.length);
}

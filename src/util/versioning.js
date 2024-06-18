/**
 * @typedef {import('@better-builds/lets-version')} ChangeLogLineFormatter
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
 * @property {boolean} allowUncommitted
 * @property {TurboToolsConfig | null} [customConfig]
 * @property {boolean} dryRun
 * @property {boolean} force
 * @property {boolean} noChangelog
 * @property {boolean} noCommit
 * @property {boolean} noFetchAll
 * @property {boolean} noFetchTags
 * @property {boolean} noPush
 * @property {string[]} names
 * @property {'major' | 'minor' | 'patch' | 'alpha' | 'beta' | string} [releaseAs]
 * @property {boolean} [rollupChangelog=false]
 * @property {boolean} yes
 * @property {boolean} uniqify
 * @property {boolean} saveExact
 * @property {boolean} updateOptional
 * @property {boolean} updatePeer
 */

/**
 * @param {VersionOpts} opts
 */
export async function versionWithLetsVersion(opts) {
  const {
    allowUncommitted,
    customConfig,
    dryRun,
    force,
    noChangelog,
    noCommit,
    noFetchAll,
    noPush,
    names,
    releaseAs,
    rollupChangelog,
    uniqify,
    saveExact,
    updateOptional,
    updatePeer,
    yes,
  } = opts;

  const result = await applyRecommendedBumpsByPackage({
    allowUncommitted,
    customConfig: customConfig?.version,
    dryRun,
    noChangelog,
    noCommit,
    noFetchAll,
    noPush,
    names,
    force,
    // @ts-ignore
    releaseAs: releaseAs || 'auto',
    rollupChangelog,
    uniqify,
    saveExact,
    updateOptional,
    updatePeer,
    yes,
  });

  return Boolean(result?.bumps.length);
}

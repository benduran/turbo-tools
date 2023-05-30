import { applyRecommendedBumpsByPackage } from '@better-builds/lets-version/dist/lets-version.mjs';

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
 * @property {boolean} forceTags
 * @property {'major' | 'minor' | 'patch' | 'alpha' | 'beta' | string} [releaseAs]
 * @property {boolean} willPublish
 * @property {boolean} yes
 */

/**
 * @param {VersionOpts} opts
 */
export async function versionWithLetsVersion(opts) {
  await applyRecommendedBumpsByPackage(undefined, opts.releaseAs, undefined, opts.all, opts.forceTags, {
    yes: opts.yes,
    dryRun: opts.dryRun,
  });
}

import {
  applyRecommendedBumpsByPackage,
  ApplyRecommendedBumpsByPackageOpts,
  ReleaseAsPresets,
} from '@better-builds/lets-version';

import { type TurboToolsConfig } from '../config.js';

/**
 * Determines the release tag to use before publishing to NPM
 */
export function determinePublishTag(releaseAs?: ReleaseAsPresets) {
  return releaseAs === 'alpha' || releaseAs === 'beta' ? releaseAs : '';
}

export interface VersionOpts extends Omit<ApplyRecommendedBumpsByPackageOpts, 'customConfig'> {
  customConfig?: TurboToolsConfig;
}

export async function versionWithLetsVersion(opts: VersionOpts) {
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
    // @ts-expect-error - we can't cast in plain JS to the union type here, so we'll silence TSC instead
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

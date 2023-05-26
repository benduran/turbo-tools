import yargs from 'yargs';

/**
 * Utility Yargs function to be used between the Publish and Version CLI commands.
 * Maps a shared, baseline set of CLI args between both
 */
export function getVersionAndPublishBaseYargs(yargs: yargs.Argv) {
  return yargs
    .option('all', {
      alias: 'a',
      default: false,
      description:
        'If true, dirties all monorepo packages and thus, forces them all to be version bumped and published',
      type: 'boolean',
    })
    .option('dryRun', {
      alias: 'd',
      default: false,
      description:
        'If true, will perform all steps right up until publish, and then output what would happen if publish were to continue',
      type: 'boolean',
    })
    .option('forceTags', {
      default: false,
      description: 'If true, will force push all git tags, both new and existing, to upstream',
      type: 'boolean',
    })
    .option('releaseAs', {
      description:
        'Releases each changed package as this release type or as an exact version. "major" "minor" "patch" "alpha" "beta" or an exact semver version number are allowed.',
      type: 'string',
    })
    .option('yes', {
      alias: 'y',
      default: false,
      description: 'If true, bypasses any prompts',
      type: 'boolean',
    });
}

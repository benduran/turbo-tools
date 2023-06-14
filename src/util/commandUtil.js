/**
 * @typedef {import('yargs').Argv} Argv
 */

/**
 * Utility Yargs function to be used between the Publish and Version CLI commands.
 * Maps a shared, baseline set of CLI args between both
 *
 * @param {Argv} yargs
 */
export function getVersionAndPublishBaseYargs(yargs) {
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
    .option('noFetchAll', {
      default: false,
      description: 'If true, will not fetch information from remote via "git fetch origin"',
      type: 'boolean',
    })
    .option('noFetchTags', {
      default: false,
      description:
        'If true, does not force fetch tags from origin. By default, lets-version will do "git fetch origin --tags --force" to ensure your branch if up-to-date with the tags on origin',
      type: 'boolean',
    })
    .option('releaseAs', {
      description:
        'Releases each changed package as this release type or as an exact version. "major" "minor" "patch" "alpha" "beta" or an exact semver version number are allowed.',
      type: 'string',
    })
    .option('rollupChangelog', {
      default: false,
      description:
        'If true, in addition to updating changelog files for all packages that will be bumped, creates a "rollup" CHANGELOG.md at the root of the repo that contains an aggregate of changes',
      type: 'boolean',
    })
    .option('uniqify', {
      default: false,
      description:
        'If true, will append the git SHA at version bunp time to the end of the version number (while maintaining valid semver)',
      type: 'boolean',
    })
    .option('yes', {
      alias: 'y',
      default: false,
      description: 'If true, bypasses any prompts',
      type: 'boolean',
    });
}

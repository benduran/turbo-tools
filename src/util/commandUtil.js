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
    .option('package', {
      alias: 'p',
      description:
        'Scope the version bump and / or publish operation to specific packages. You can specify multiple by doing -p <name1> -p <name2> -p <name3>',
      type: 'array',
    })
    .options({
      all: {
        alias: 'a',
        default: false,
        deprecated: 'Use --force instead',
        description:
          'If true, dirties all monorepo packages and thus, forces them all to be version bumped and published',
        type: 'boolean',
      },
      allowUncommitted: {
        default: false,
        description:
          'If true, will allow the version operation to continue when there are uncommitted files in the repo at version bump time. This is usefull if you have some scripts that need to run after version bumps are performed, but potentially before you issue a git commit and subsequent npm publish operation.',
        type: 'boolean',
      },
      dryRun: {
        alias: 'd',
        default: false,
        description:
          'If true, will perform all steps right up until publish, and then output what would happen if publish were to continue',
        type: 'boolean',
      },
      force: {
        default: false,
        description:
          'If true, dirties all monorepo packages and thus, forces them all to be version bumped and published',
        type: 'boolean',
      },
      noChangelog: {
        default: false,
        description: 'If true, will not write CHANGELOG.md updates for each package that has changed',
        type: 'boolean',
      },
      noCommit: {
        default: false,
        description:
          'If true, will modify all required files but leave them uncommitted after all operations have completed. This will also prevent a git push from occurring',
        type: 'boolean',
      },
      noFetchAll: {
        default: false,
        description: 'If true, will not fetch information from remote via "git fetch origin"',
        type: 'boolean',
      },
      noFetchTags: {
        default: false,
        description:
          'If true, does not force fetch tags from origin. By default, lets-version will do "git fetch origin --tags --force" to ensure your branch if up-to-date with the tags on origin',
        type: 'boolean',
      },
      noPush: {
        default: false,
        description: 'If true, will not push changes and tags to origin',
        type: 'boolean',
      },
      updatePeer: {
        default: false,
        description: 'If true, will update any dependent "package.json#peerDependencies" fields',
        type: 'boolean',
      },
      updateOptional: {
        default: false,
        description: 'If true, will update any dependent "package.json#optionalDependencies" fields',
        type: 'boolean',
      },
      releaseAs: {
        description:
          'Releases each changed package as this release type or as an exact version. "major" "minor" "patch" "alpha" "beta" or an exact semver version number are allowed.',
        type: 'string',
      },
      rollupChangelog: {
        default: false,
        description:
          'If true, in addition to updating changelog files for all packages that will be bumped, creates a "rollup" CHANGELOG.md at the root of the repo that contains an aggregate of changes',
        type: 'boolean',
      },
      uniqify: {
        default: false,
        description:
          'If true, will append the git SHA at version bunp time to the end of the version number (while maintaining valid semver)',
        type: 'boolean',
      },
      saveExact: {
        default: false,
        description:
          "If true, saved dependencies will be configured with an exact version rather than using npm's default semver range operator",
        type: 'boolean',
      },
      yes: {
        alias: 'y',
        default: false,
        description: 'If true, bypasses any prompts',
        type: 'boolean',
      },
    });
}

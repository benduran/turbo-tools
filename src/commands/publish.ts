import { getRecommendedBumpsByPackage, ReleaseAsPresets } from '@better-builds/lets-version';
import { Argv } from 'yargs';

import { readTurboToolsConfig } from '../config.js';
import {
  determinePublishTag,
  execFromDir,
  execFromRoot,
  findPackages,
  getPackageManager,
  getVersionAndPublishBaseYargs,
  guardTurboExists,
  versionWithLetsVersion,
} from '../util/index.js';

export async function publish(yargs: Argv) {
  const {
    all: __deprecatedAll,
    allowUncommitted,
    dryRun,
    force,
    noChangelog,
    noCommit,
    noFetchAll,
    noFetchTags,
    noPush,
    package: names,
    releaseAs,
    rollupChangelog,
    skipBuild,
    skipLint,
    skipTest,
    uniqify,
    saveExact,
    updateOptional,
    updatePeer,
    yes,
  } = await getVersionAndPublishBaseYargs(yargs)
    .option('skipBuild', {
      default: false,
      description:
        'If true, skips running the build command across all changed repositories before attempting to publish',
      type: 'boolean',
    })
    .option('skipLint', {
      default: false,
      description:
        'If true, skips running the lint command across all changed repositories before attempting to publish',
      type: 'boolean',
    })
    .option('skipTest', {
      default: false,
      description:
        'If true, skips running the test command across all changed repositories before attempting to publish',
      type: 'boolean',
    })
    .help().argv;

  const publishTag = determinePublishTag(releaseAs as ReleaseAsPresets | undefined);

  const bumpInfos = await getRecommendedBumpsByPackage({
    force,
    names: (names ?? []).map(String),
    noFetchTags,
    releaseAs: releaseAs as ReleaseAsPresets,
    updateOptional,
    updatePeer,
    uniqify,
  });

  const changedPreBumpLookup = new Set(bumpInfos.bumps.map(b => b.packageInfo.name));

  const filterArg =
    bumpInfos.bumps.length > 0 ? bumpInfos.bumps.map(b => `--filter="${b.packageInfo.name}"`).join(' ') : '';

  if (!filterArg) {
    return console.warn(
      'turbo-tools publish is exiting because no packages were found to have been directly changed that need publishing',
    );
  }

  const turboExists = guardTurboExists();
  if (!turboExists) process.exit(1);

  if (!skipLint) {
    execFromRoot({ cmd: 'npx', args: ['turbo', 'run', 'lint', filterArg], stdio: 'inherit' });
  }

  if (!skipTest) {
    execFromRoot({
      cmd: 'npx',
      args: ['turbo', 'run', '--continue', 'test', filterArg],
      stdio: 'inherit',
    });
  }

  if (!skipBuild) {
    execFromRoot({
      cmd: 'npx',
      args: ['turbo', 'run', '--continue', 'build', filterArg],
      stdio: 'inherit',
    });
  }

  const turboToolsCustomConfig = await readTurboToolsConfig();

  const whichPackageManager = await getPackageManager();

  const success = await versionWithLetsVersion({
    allowUncommitted,
    customConfig: turboToolsCustomConfig ?? undefined,
    dryRun,
    force: __deprecatedAll ?? force,
    names: (names ?? []).map(String),
    noCommit,
    noChangelog,
    noFetchAll,
    noFetchTags,
    noPush,
    releaseAs: releaseAs as ReleaseAsPresets,
    rollupChangelog,
    uniqify,
    saveExact,
    updateOptional,
    updatePeer,
    yes,
  });

  if (!success) return console.info('Version bumps were aborted');

  const changedPostBumpPackages = (await findPackages()).filter(p => changedPreBumpLookup.has(p.name));

  // rebuild all, again, from root, just to be safe
  if (!skipBuild) {
    execFromRoot({ args: ['turbo', 'run', 'build', filterArg], cmd: 'npx', stdio: 'inherit' });
  }

  const publishSuccessMap = {};
  const publishFailureMap = {};

  for (const packageInfo of changedPostBumpPackages) {
    if (packageInfo.isPrivate) {
      console.info(`Skipping publishing ${packageInfo.name} because it is marked private`);
      continue;
    }
    try {
      const canPublish = await (turboToolsCustomConfig?.publish?.checkCanPublish?.({
        all: __deprecatedAll ?? force,
        dryRun,
        force: __deprecatedAll ?? force,
        packagePath: packageInfo.packagePath,
        publishTag,
        releaseAs,
        yes,
      }) ?? Promise.resolve(true));
      if (!canPublish) process.exit(1);

      const customPublishCmd = turboToolsCustomConfig?.publish?.getCommand?.({
        all: __deprecatedAll ?? force,
        dryRun,
        force: __deprecatedAll ?? force,
        packageName: packageInfo.name,
        packagePath: packageInfo.packagePath,
        releaseAs,
        yes,
      });
      const publishCmd = customPublishCmd?.cmd ?? whichPackageManager;
      const publishArgs = customPublishCmd?.args ?? ['publish'];

      if (!dryRun) {
        execFromDir({ args: publishArgs, cmd: publishCmd, cwd: packageInfo.packagePath, stdio: 'inherit' });
      } else {
        console.info(`  Publishing ${packageInfo.name} using command:\n    ${publishCmd} ${publishArgs.join(' ')}`);
      }
      // @ts-expect-error - dictionary access is safe because we've guarded against the name above
      publishSuccessMap[packageInfo.name] = packageInfo.version;
    } catch (error) {
      console.error(`FAIL: ${packageInfo.name} failed to publish!`);
      console.error(error);
      // @ts-expect-error - same issue as above
      publishFailureMap[packageInfo.name] = packageInfo.version;
    }
  }

  const numOfPublishedPackages = Object.keys(publishSuccessMap).length;
  console.info('\n\n*********************************************\n');
  console.info(`Published ${numOfPublishedPackages} package${numOfPublishedPackages === 1 ? '' : 's'}`);
  Object.entries(publishSuccessMap).forEach(([name, version]) => {
    console.info(`  ${name}@${version}`);
  });
  const failedEntries = Object.entries(publishFailureMap);
  if (failedEntries.length) {
    console.info(`Failed to publish ${failedEntries.length} package${failedEntries.length === 1 ? '' : 's'}`);
    failedEntries.forEach(([name, version]) => {
      console.info(`  ${name}@${version}`);
    });
  }
  console.info('\n\n*********************************************\n');

  // cleanup any outstanding changes for a nice working dir
  execFromRoot({ args: ['checkout', '.'], cmd: 'git', stdio: 'inherit' });
}

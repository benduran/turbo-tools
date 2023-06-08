/**
 * @typedef {import('yargs').Argv} Argv
 */

import { getRecommendedBumpsByPackage } from '@better-builds/lets-version';

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

/**
 *
 * @param {Argv} yargs
 */
export async function publish(yargs) {
  const { all, dryRun, noFetchAll, noFetchTags, releaseAs, skipBuild, skipLint, skipTest, uniqify, yes } =
    await getVersionAndPublishBaseYargs(yargs)
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

  const publishTag = determinePublishTag(releaseAs);

  const bumpInfos = await getRecommendedBumpsByPackage(
    undefined,
    releaseAs,
    undefined,
    uniqify,
    all,
    noFetchTags,
    undefined,
    undefined,
  );

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

  const turboToolsCustomConfig = readTurboToolsConfig();
  const customPublishCmd = turboToolsCustomConfig?.publish?.getCommand?.({
    all,
    dryRun,
    releaseAs,
    yes,
  });

  const whichPackageManager = await getPackageManager();
  const publishCmd = customPublishCmd?.cmd ?? whichPackageManager;
  const publishArgs = customPublishCmd?.args ?? ['publish'];

  const success = await versionWithLetsVersion({
    all,
    dryRun,
    forceTags: !noFetchTags,
    noFetchAll,
    releaseAs,
    uniqify,
    willPublish: true,
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
        all,
        dryRun,
        packagePath: packageInfo.packagePath,
        publishTag,
        releaseAs,
        yes,
      }) ?? Promise.resolve(true));
      if (!canPublish) process.exit(1);

      if (!dryRun) {
        execFromDir({ args: publishArgs, cmd: publishCmd, cwd: packageInfo.packagePath, stdio: 'inherit' });
      } else {
        console.info(`  Publishing ${packageInfo.name} using command:\n    ${publishCmd} ${publishArgs.join(' ')}`);
      }
      // @ts-ignore
      publishSuccessMap[packageInfo.name] = packageInfo.version;
    } catch (error) {
      console.error(`FAIL: ${packageInfo.name} failed to publish!`);
      console.error(error);
      // @ts-ignore
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

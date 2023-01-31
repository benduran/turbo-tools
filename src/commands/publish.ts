import type yargs from 'yargs';

import { readTurboToolsConfig } from '../config';
import {
  determinePublishTag,
  execSyncFromDir,
  execSyncFromRoot,
  findPackages,
  getPackageManager,
  getVersionAndPublishBaseYargs,
  guardTurboExists,
  versionWithLerna,
} from '../util';

export async function publish(yargs: yargs.Argv) {
  const { all, dryRun, releaseAs, skipLint, skipTest, yes } = await getVersionAndPublishBaseYargs(yargs)
    .option('skipLint', {
      default: false,
      description: 'If true, skips running the lint command across all changed repositories before publishing',
      type: 'boolean',
    })
    .option('skipTest', {
      default: false,
      description: 'If true, skips running the test command across all changed repositories before publishing',
      type: 'boolean',
    })
    .help().argv;

  const publishTag = determinePublishTag(releaseAs);

  let lernaDetectedChanges = '';
  try {
    lernaDetectedChanges = execSyncFromRoot({
      args: ['lerna', 'changed'],
      cmd: 'npx',
      stdio: 'pipe',
    }).toString('utf8');
  } catch (error) {
    const err = error as Error;
    console.error(err.message);
    process.exit(err.message.includes('No changed packages found') ? 0 : 1);
  }
  const changedPreBumpPackages = (await findPackages()).filter(p => all || lernaDetectedChanges.includes(p.name));
  console.info('\n', changedPreBumpPackages.length, 'changed packages found to publish\n');

  const changedPreBumpLookup = new Set(changedPreBumpPackages.map(p => p.name));

  const filterArg =
    changedPreBumpPackages.length > 0 ? changedPreBumpPackages.map(p => `--filter="${p.name}"`).join(' ') : '';

  const turboExists = await guardTurboExists();
  if (!turboExists) process.exit(1);

  if (!skipLint) {
    execSyncFromRoot({ cmd: 'npx', args: ['turbo', 'run', 'lint', filterArg], stdio: 'inherit' });
  }

  if (!skipTest) {
    execSyncFromRoot({
      cmd: 'npx',
      args: ['turbo', 'run', '--continue', 'test', filterArg],
      stdio: 'inherit',
    });
  }

  execSyncFromRoot({
    cmd: 'npx',
    args: ['turbo', 'run', '--continue', 'build', filterArg],
    stdio: 'inherit',
  });

  const turboToolsCustomConfig = readTurboToolsConfig();
  const customPublishCmd = turboToolsCustomConfig?.publish?.getCommand?.({
    all,
    dryRun,
    publishTag,
    releaseAs,
    yes,
  });

  const whichPackageManager = await getPackageManager();
  const publishCmd = customPublishCmd?.cmd ?? whichPackageManager;
  const publishArgs = customPublishCmd?.args ?? ['publish'];

  await versionWithLerna({
    all,
    dryRun,
    publishTag,
    releaseAs,
    willPublish: true,
    yes,
  });

  const changedPostBumpPackages = (await findPackages()).filter(p => changedPreBumpLookup.has(p.name));

  // rebuild all, again, from root, just to be safe
  execSyncFromRoot({ args: ['turbo', 'run', 'build', filterArg], cmd: 'npx', stdio: 'inherit' });

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
        execSyncFromDir({ args: publishArgs, cmd: publishCmd, cwd: packageInfo.packagePath, stdio: 'inherit' });
      } else {
        console.info(`  Publishing ${packageInfo.name} using command:\n    ${publishCmd} ${publishArgs.join(' ')}`);
      }
      publishSuccessMap[packageInfo.name] = packageInfo.version;
    } catch (error) {
      console.error(`FAIL: ${packageInfo.name} failed to publish!`);
      console.error(error);
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
  execSyncFromRoot({ args: ['checkout', '.'], cmd: 'git', stdio: 'inherit' });
}

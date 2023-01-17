#!/usr/bin/env node

import yargs from 'yargs';

import { init, list, publish, run, version } from './commands';

export async function monorepoToolsCLI() {
  const argv = await yargs
    .scriptName('turbo-tools')
    .command('version', 'Skips publishing and just version bumps packages in your monorepo', version)
    .command(
      'publish',
      'Publishes packages in a Turborepo-powered Monorepo, and optionally uses whichever custom Publish command you may need (if overwritten in turboTools.config.js)',
      publish,
    )
    .command('run', "Pass-through to Turborepo's run command", run)
    .command('init', 'Initializes a sane default configuration of config files to work with the monorepo-tools', init)
    .command('ls', 'Lists all the packages in the monorepo, as detected officially by NPM', list)
    .help().argv;

  if (!argv._.length) yargs.showHelp();
}

monorepoToolsCLI();

#!/usr/bin/env node

import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';
import setupYargs from 'yargs';
import { hideBin } from 'yargs/helpers';

import { init, list, publish, run, version } from './commands/index.js';

export async function monorepoToolsCLI() {
  const __dirname = path.dirname(fileURLToPath(import.meta.url));

  const { version: turboToolsVersion } = JSON.parse(
    await fs.readFile(path.join(__dirname, '../package.json'), 'utf-8'),
  );

  const yargs = setupYargs(hideBin(process.argv));
  const argv = await yargs
    .scriptName('turbo-tools')
    .version(turboToolsVersion)
    .command('version', 'Skips publishing and just version bumps packages in your monorepo', version)
    .command(
      'publish',
      'Publishes packages in a Turborepo-powered Monorepo, and optionally uses whichever custom Publish command you may need (if overwritten in turboTools.config.js)',
      publish,
    )
    .command('run', "Pass-through to Turborepo's run command", run)
    .command('init', 'Initializes a sane default configuration of config files to work with the turbo-tools', init)
    .command('ls', 'Lists all the packages in the monorepo, as detected officially by NPM', list)
    .help().argv;

  if (!argv._.length) yargs.showHelp();
}

monorepoToolsCLI();

#!/usr/bin/env node

/**
 * @typedef {import('yargs').Argv} Argv
 */

import { EOL } from 'os';

import { findPackages } from '../util/index.js';

/**
 * Lists all the packages in the monorepo, as detected
 * by the official NPM CLI
 *
 * @param {Argv} yargs
 */
export async function list(yargs) {
  const { json } = await yargs.option('json', {
    alias: 'j',
    description:
      'If true, prints resulting monorepo package information as JSON. If false, prints the path to each package instead.',
    default: false,
    type: 'boolean',
  }).argv;

  const packages = await findPackages();

  if (json) return console.info(JSON.stringify(packages, null, 2));
  return console.info(packages.map(p => p.packagePath).join(EOL));
}

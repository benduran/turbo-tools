/**
 * @typedef {import('yargs').Argv} Argv
 */

import { execFromRoot } from '../util/index.mjs';

/**
 * This is really just a convenience, pass-through command
 * that pipes straight into Turborepo
 *
 * @param {Argv} yargs
 */
export async function run(yargs) {
  const argv = await yargs.parserConfiguration({ 'unknown-options-as-args': true }).argv;

  try {
    execFromRoot({
      cmd: 'npx',
      args: ['turbo', 'run', ...argv._.slice(1).map(String)],
      stdio: 'inherit',
    });
  } catch (error) {
    /* no-op because the stdio: 'inherit' will cause turbo to report errors in a nicer manner */
    process.exit(1);
  }
}

import type yargs from 'yargs';

import { execFromRoot } from '../util';

/**
 * This is really just a convenience, pass-through command
 * that pipes straight into Turborepo
 */
export async function run(yargs: yargs.Argv) {
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

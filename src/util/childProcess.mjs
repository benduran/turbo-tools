import appRootPath from 'app-root-path';
import { execSync } from 'child_process';

/**
 * @typedef {Object} ExecFromDirOptions
 * @property {string[]} args
 * @property {string} cmd
 * @property {string} cwd
 * @property {'inherit' | 'pipe'} stdio
 */

// 5 MB
const MAX_BUFFER_SIZE = 1024 * 1024 * 5;

/**
 * Executes a command asynchronously from a specific dir
 * @param {ExecFromDirOptions} opts
 */
export function execFromDir({ args, cmd, cwd, stdio }) {
  const toExec = `${cmd} ${args.join(' ')}`;
  console.info(`Executing ${toExec} in ${cwd}`);

  return execSync(toExec, { cwd, maxBuffer: MAX_BUFFER_SIZE, stdio })?.toString('utf-8').trim() || '';
}

/**
 * Executes a command synchronously in the root of the project a.k.a. the monorepo root
 *
 * @param {Omit<ExecFromDirOptions, 'cwd'>} args
 */
export function execFromRoot(args) {
  return execFromDir({ ...args, cwd: appRootPath.toString() });
}

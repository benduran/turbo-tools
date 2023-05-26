import appRootPath from 'app-root-path';
import { execSync } from 'child_process';

interface ExecFromDirOptions {
  args: string[];
  cmd: string;
  cwd: string;
  stdio: 'inherit' | 'pipe';
}

// 5 MB
const MAX_BUFFER_SIZE = 1024 * 1024 * 5;

/**
 * Executes a command asynchronously from a specific dir
 */
export function execFromDir({ args, cmd, cwd, stdio }: ExecFromDirOptions) {
  const toExec = `${cmd} ${args.join(' ')}`;
  console.info(`Executing ${toExec} in ${cwd}`);

  return execSync(toExec, { cwd, maxBuffer: MAX_BUFFER_SIZE, stdio })?.toString('utf-8').trim() || '';
}

/**
 * Executes a command synchronously in the root of the project a.k.a. the monorepo root
 */
export function execFromRoot(args: Omit<ExecFromDirOptions, 'cwd'>) {
  return execFromDir({ ...args, cwd: appRootPath.toString() });
}

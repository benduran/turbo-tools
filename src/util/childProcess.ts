import appRootPath from 'app-root-path';
import { spawn } from 'child_process';
import os from 'os';

interface ExecFromDirOptions {
  args: string[];
  cmd: string;
  cwd: string;
  stdio: 'inherit' | 'pipe';
}

interface ExecFromDirReturn {
  stderr: string;
  stdout: string;
}

/**
 * Executes a command asynchronously from a specific dir
 */
export function execFromDir({ args, cmd, cwd, stdio }: ExecFromDirOptions): Promise<ExecFromDirReturn> {
  const toExec = `${cmd} ${args.join(' ')}`;
  console.info(`Executing ${toExec}`);
  return new Promise<ExecFromDirReturn>((resolve, reject) => {
    const child = spawn(cmd, args, { stdio });
    child.once('error', reject);

    const stdoutChunks: any[] = [];
    const stderrChunks: any[] = [];

    child.stdout?.on('data', chunk => stdoutChunks.push(chunk));
    child.stderr?.on('data', chunk => stderrChunks.push(chunk));

    child.once('exit', code => {
      const stdout = Buffer.from(stdoutChunks).toString('utf-8');
      const stderr = Buffer.from(stderrChunks).toString('utf-8');
      if (code === 0) {
        return resolve({
          stdout,
          stderr,
        });
      }
      return reject(new Error(`Failed to execute ${toExec} because of an error: ${os.EOL}${os.EOL}${stderr}`));
    });
  });
}

/**
 * Executes a command synchronously in the root of the project a.k.a. the monorepo root
 */
export function execFromRoot(args: Omit<ExecFromDirOptions, 'cwd'>) {
  return execFromDir({ ...args, cwd: appRootPath.toString() });
}

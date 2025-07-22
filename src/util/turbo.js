import appRootPath from 'app-root-path';
import JSON from 'comment-json';
import fs from 'fs-extra';
import path from 'path';

import { execFromRoot } from './childProcess.js';

/**
 * Utility function that performs checks to determine
 * if turbo was installed correctly, and if a proper "turbo.json"
 * file exists, that it has "lint," "test," and "build" commands
 */
export async function guardTurboExists() {
  try {
    execFromRoot({ cmd: 'npx', args: ['turbo', '--help'], stdio: 'pipe' });
  } catch (error) {
    /* if we get here, turbo does NOT exist */
    console.error('turbo has not been installed. unable to use the turbo-tools');
    return false;
  }
  const turboJsonPath = path.join(appRootPath.toString(), 'turbo.json');
  try {
    const turboJsonStat = await fs.stat(turboJsonPath);
    if (!turboJsonStat.isFile()) throw new Error('turbo.json is missing');
  } catch (error) {
    /* turbo.json is missing */
    console.error('turbo.json is missing. unable to use the turbo-tools');
    return false;
  }
  const turboJsonContents = Object(JSON.parse(await fs.readFile(turboJsonPath, 'utf8')));
  if (!turboJsonContents.tasks?.build) {
    console.error('turbo.json is missing a "build" task. unable to use the turbo-tools');
    return false;
  }
  if (!turboJsonContents.tasks?.lint) {
    console.error('turbo.json is missing a "lint" task. unable to use the turbo-tools');
    return false;
  }
  if (!turboJsonContents.tasks?.test) {
    console.error('turbo.json is missing a "test" task. unable to use the turbo-tools');
    return false;
  }
  return true;
}

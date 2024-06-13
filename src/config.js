/**
 * @typedef {import('type-fest').PackageJson} PackageJson
 * @typedef {import('@better-builds/lets-version').LetsVersionConfig} LetsVersionConfig
 */

import fs from 'fs-extra';
import path from 'path';

/**
 * @typedef {Object} CustomFncOpts
 *
 * @property {boolean} all - Deprecated. Use "force" property instead
 * @property {boolean} dryRun
 * @property {boolean} force
 * @property {string} [releaseAs]
 * @property {boolean} yes
 */

/**
 * @typedef {Object} GetPublishCmdOpts
 * @property {string} packageName
 * @property {string} packagePath
 */

/**
 * @typedef {Object} AddToPackageJsonOpts
 *
 * @property {boolean} noDeps
 * @property {boolean} noPublish
 * @property {string} monorepoRoot
 * @property {string} whichPackageManager
 */

/**
 * Allows you to specify additional contents that will be merged into
 * the generated package.json file when running the "turbo-tools init" command
 *
 * @callback AddToPackageJson
 * @param {AddToPackageJsonOpts} opts
 * @returns {Partial<PackageJson>}
 */

/**
 * @typedef {Object} CheckCanPublishOpts
 * @property {boolean} [all=false] - Deprecated. Use "force" instead
 * @property {boolean} [dryRun=false]
 * @property {boolean} [force=false]
 * @property {string} packagePath
 * @property {'alpha' | 'beta' | ''} [publishTag='']
 * @property {string} [releaseAs]
 * @property {boolean} [yes=false]
 */

/**
 *
 * Given a series of arguments provided to the Turbo Tools,
 * expects you to return an async true or false for whether or
 * not this publish should continue.
 *
 * If this function doesn't exist, `true` will be used by default
 *
 * @callback CheckCanPublish
 * @param {CheckCanPublishOpts} opts
 * @returns {Promise<boolean>}
 */

/**
 * @typedef GetCommandReturnType
 * @property {string[]} args
 * @property {string} cmd
 */

/**
 *
 * Given a series of arguments provided to the Turbo Tools,
 * expects you to return a string representing the CLI command
 * to use for publishing packages for your project.
 * This is useful, particularly at enterprise companies, where
 * a custom NPM repository and publish command
 * may be used before pushing.
 *
 * If this function doesn't exist or if it returns a falsey value, "npm publish" will be used as default
 * @callback GetCommand
 * @param {CustomFncOpts & GetPublishCmdOpts} opts
 *
 * @returns {GetCommandReturnType}
 */

/**
 * @typedef {Object} TurboToolsInitConfig
 *
 * @property {AddToPackageJson} [addToPackageJson]
 */

/**
 * @typedef {Object} TurboToolsPublishConfig
 * @property {GetCommand} [getCommand]
 * @property {CheckCanPublish} [checkCanPublish]
 */

/**
 * @typedef {Object} TurboToolsConfig
 *
 * @property {TurboToolsInitConfig} [init]
 * @property {TurboToolsPublishConfig} [publish]
 * @property {LetsVersionConfig} [version]
 */

/**
 * Utility function that returns an array of all paths
 * in the CWD up to the root
 */
function getAllFoldersUpToRoot() {
  /** @type {string[]} */
  const out = [];
  const cwd = process.cwd();

  let buffer = '';
  for (const char of cwd) {
    if (char === path.sep) out.push(buffer.length ? buffer : path.sep);

    buffer += char;
  }

  out.push(buffer);

  return out.sort((a, b) => b.localeCompare(a));
}

/**
 * Attempts to read the nearest turboTools.config.js file (if it exists)
 * and returns its contents
 *
 * @returns {Promise<TurboToolsConfig | null>}
 */
export async function readTurboToolsConfig() {
  /**
   * @param {string} prefix
   * @returns {string}
   */
  const getTurboToolsConfigFilePath = prefix => {
    if (prefix.endsWith(path.sep)) return `${prefix}turboTools.config.mjs`;
    return `${prefix}${path.sep}turboTools.config.mjs`;
  };

  for (const dir of getAllFoldersUpToRoot()) {
    const turboConfigPath = getTurboToolsConfigFilePath(dir);
    const isFile = fs.statSync(turboConfigPath, { throwIfNoEntry: false })?.isFile() || false;
    if (isFile) {
      const result = await import(turboConfigPath);
      return result.default;
    }
  }

  return null;
}

/**
 * Simple pass-through utility for providing TypeScript typings
 * in non-TS environments when defining a config override
 *
 * @param {TurboToolsConfig} config
 *
 * @returns {TurboToolsConfig}
 */
export function defineTurboToolsConfig(config) {
  return config;
}

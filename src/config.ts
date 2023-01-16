import type { PM } from 'detect-package-manager';
import fs from 'fs-extra';
import path from 'path';
import type { PackageJson } from 'type-fest';

import type { determinePublishTag } from './util';

export interface CustomFncOpts {
  all: boolean;
  dryRun: boolean;
  releaseAs?: string;
  publishTag: ReturnType<typeof determinePublishTag>;
  yes: boolean;
}

export interface AddToPackageJsonOpts {
  noDeps: boolean;
  noPublish: boolean;
  monorepoRoot: string;
  whichPackageManager: PM;
}

/**
 * Represents the plugin configuration for the turbo tools
 */
export type TurboToolsConfig = Partial<{
  init: Partial<{
    /**
     * Allows you to specify additional contents that will be merged into
     * the generated package.json file when running the "turbo-tools init" command
     */
    addToPackageJson: (opts: AddToPackageJsonOpts) => Partial<PackageJson>;
  }>;
  publish: Partial<{
    /**
     * Given a series of arguments provided to the Turbo Tools,
     * expects you to return an async true or false for whether or
     * not this publish should continue.
     *
     * If this function doesn't exist, `true` will be used by default
     */
    checkCanPublish: (opts: CustomFncOpts) => Promise<boolean>;

    /**
     * Given a series of arguments provided to the Turbo Tools,
     * expects you to return a string representing the CLI command
     * to use for publishing packages for your project.
     * This is useful, particularly at enterprise companies, where
     * a custom NPM repository and publish command
     * may be used before pushing.
     *
     * If this function doesn't exist or if it returns a falsey value, "npm publish" will be used as default
     */
    getCommand: (opts: CustomFncOpts) => {
      args: string[];
      cmd: string;
    };
  }>;
}>;

/**
 * Utility function that returns an array of all paths
 * in the CWD up to the root
 */
function getAllFoldersUpToRoot() {
  const out: string[] = [];
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
 */
export function readTurboToolsConfig(): TurboToolsConfig | null {
  const getTurboToolsConfigFilePath = (prefix: string) => {
    if (prefix.endsWith(path.sep)) return `${prefix}turboTools.config.js`;
    return `${prefix}${path.sep}turboTools.config.js`;
  };

  for (const dir of getAllFoldersUpToRoot()) {
    const turboConfigPath = getTurboToolsConfigFilePath(dir);
    try {
      const stat = fs.statSync(turboConfigPath);
      if (stat.isFile()) return require(turboConfigPath);
    } catch (error) {}
  }

  return null;
}

/**
 * Simple pass-through utility for providing TypeScript typings
 * in non-TS environments when defining a config override
 */
export function defineTurboToolsConfig(config: TurboToolsConfig): TurboToolsConfig {
  return config;
}

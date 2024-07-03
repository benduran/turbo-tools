import { type LetsVersionConfig } from '@better-builds/lets-version';
import fs from 'fs-extra';
import path from 'path';
import { type PackageJson } from 'type-fest';

export interface CustomFncOpts {
  /**
   * Deprecated. Use "force" property instead
   */
  all?: boolean;
  dryRun?: boolean;
  force?: boolean;
  releaseAs?: ReleaseAsPreset;
  yes?: boolean;
}

export interface GetPublishCmdOpts {
  packageName: string;
  packagePath: string;
}

export interface AddToPackageJsonOpts {
  noDeps: boolean;
  noPublish: boolean;
  monorepoRoot: string;
  whichPackageManager: WhichPM;
}

/*
 * Allows you to specify additional contents that will be merged into
 * the generated package.json file when running the "turbo-tools init" command
 */
export type AddToPackageJson = (opts: AddToPackageJsonOpts) => Partial<PackageJson>;

export interface CheckCanPublishOpts {
  all?: boolean; // Deprecated. Use "force" instead
  dryRun?: boolean;
  force?: boolean;
  packagePath: string;
  publishTag?: 'alpha' | 'beta' | '';
  releaseAs?: string;
  yes?: boolean;
}

/**
 *
 * Given a series of arguments provided to the Turbo Tools,
 * expects you to return an async true or false for whether or
 * not this publish should continue.
 *
 * If this function doesn't exist, `true` will be used by default
 */
export type CheckCanPublish = (opts: CheckCanPublishOpts) => Promise<boolean>;

export interface GetCommandReturnType {
  args: string[];
  cmd: string;
}

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
 */
export type GetCommand = (opts: CustomFncOpts & GetPublishCmdOpts) => GetCommandReturnType;

export interface TurboToolsInitConfig {
  addToPackageJson?: AddToPackageJson;
}

export interface TurboToolsPublishConfig {
  getCommand?: GetCommand;
  checkCanPublish?: CheckCanPublish;
}

export interface TurboToolsConfig {
  init?: TurboToolsInitConfig;
  publish?: TurboToolsPublishConfig;
  version?: LetsVersionConfig;
}

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
 * and returns its contents *
 */
export async function readTurboToolsConfig(): Promise<TurboToolsConfig | null> {
  const getTurboToolsConfigFilePath = (prefix: string): string => {
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
 */
export function defineTurboToolsConfig(config: TurboToolsConfig): TurboToolsConfig {
  return config;
}

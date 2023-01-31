import appRootPath from 'app-root-path';
import deepMerge from 'deepmerge';
import glob from 'fast-glob';
import fs from 'fs-extra';
import path from 'path';
import type yargs from 'yargs';

import { readTurboToolsConfig } from '../config';
import { execSyncFromDir, findPackages, getPackageManager } from '../util';

/**
 * Bootstraps sane / sensible set of default config files
 * needed to power a successful but opinionated UI monorepo
 */
export async function init(yargs: yargs.Argv) {
  console.info('Running init');
  const { noDeps, noPublish } = await yargs
    .option('noPublish', {
      alias: 'n',
      default: false,
      description: 'If true, skips writing config files required for publishing packages to NPM',
      type: 'boolean',
    })
    .options('noDeps', {
      alias: 'd',
      default: false,
      description:
        'If true, skips modifying your root package.json and installing the missing dependencies required to power your monorepo experience',
      type: 'boolean',
    }).argv;

  const monorepoRoot = appRootPath.toString();

  const which = await getPackageManager(monorepoRoot);

  const allTemplatesGlob = path.join(__dirname, '../templates', '**', '*');

  console.info(`Searching for templates in ${allTemplatesGlob}`);
  const allTemplateFiles = await glob(path.join(__dirname, '../templates', '**', '*'), {
    absolute: true,
    dot: true,
    onlyFiles: true,
  });

  const publishingTemplates = allTemplateFiles.filter(tpath => tpath.includes('publishing'));
  const depTemplates = allTemplateFiles.filter(tpath => tpath.includes('deps'));
  const nonPublishOrDepTemplates = allTemplateFiles.filter(
    tpath => !tpath.includes('publishing') && !tpath.includes('deps'),
  );

  if (!noPublish) {
    await Promise.all(
      publishingTemplates.map(async tpath => {
        const filename = path.basename(tpath);
        const dest = path.join(monorepoRoot, filename);
        const content = await fs.readFile(tpath);
        console.info(`  Writing ${dest}`);
        await fs.writeFile(dest, content);
      }),
    );

    const turboToolsCustomConfig = readTurboToolsConfig();
    const publishSnippetToAdd =
      turboToolsCustomConfig?.init?.addToPackageJson?.({
        monorepoRoot,
        noDeps,
        noPublish,
        whichPackageManager: which,
      }) ?? {};

    const allChildPackages = await findPackages(monorepoRoot);

    await Promise.all(
      allChildPackages.map(async info => {
        const pjsonPath = path.join(info.packagePath, 'package.json');
        const existingJson = JSON.parse(await fs.readFile(pjsonPath, 'utf8'));

        const merged = deepMerge(existingJson, publishSnippetToAdd);
        await fs.writeFile(pjsonPath, JSON.stringify(merged, null, 2), 'utf8');
      }),
    );
  }

  if (!noDeps) {
    await Promise.all(
      depTemplates.map(async tpath => {
        const filename = path.basename(tpath);
        const dest = path.join(monorepoRoot, filename);

        let existingContents = '';
        try {
          existingContents = await fs.readFile(dest, 'utf8');
        } catch (error) {
          /* file doesn't exist, so do nothing */
        }

        const toMerge = await fs.readFile(tpath, 'utf8');
        const toMergeJson = JSON.parse(toMerge);
        const existingToMergeJson = existingContents ? JSON.parse(existingContents) : {};

        console.info(`  Merging ${tpath} into ${dest}`);
        await fs.writeFile(dest, JSON.stringify(deepMerge(existingToMergeJson, toMergeJson), null, 2), 'utf8');
      }),
    );

    execSyncFromDir({ args: ['install'], cmd: which, cwd: monorepoRoot, stdio: 'inherit' });
  }

  await Promise.all(
    nonPublishOrDepTemplates.map(async tpath => {
      const filename = path.basename(tpath);
      const dest = path.join(monorepoRoot, filename);
      const contents = await fs.readFile(tpath);

      console.info(`  Writing ${dest}`);

      await fs.remove(dest); // remove existing file and always put the template in its place
      await fs.writeFile(dest, contents);
    }),
  );

  console.info('\n********************\n');
  console.info(
    'Your repository has been turbo and turbo-tools enabled! The last thing for you to do is to add or update your git commit-msg hook to run the following:',
  );
  console.info(`    ${which === 'npm' ? 'npx' : which} commitlint -e\n`);
  console.info(
    '  This will allow you to take advantages of the conventional commits standard and leverage Turbo Tools to manage your pacakge version numbers 👍',
  );
  console.info('\n********************\n');
}

# turbo-tools
A collection of TurboRepo CLI tools to test, lint, build, version and publish packages in your Turborepo monorepo.

[TurboRepo](https://turbo.build/), by itself, is fantastic, and you should definitely use it! However, there are a few extra commands that could be added to really make the TurboRepo experience perfect and fully-featured out of the box. This is where [Turbo Tools](https://github.com/benduran/turbo-tools) comes in!

Turbo Tools add the ability for you to perform version bumps of all your packages, as well as publishing of these packages. Turbo Tools can detect which packages have changed and only version bump and publish those, leaving the rest of your repository unchanged. You can also run the version and publish commands independently from each other, which is perfect if you're building internal applications for your company, but want each `git` change to have a real-world change to your application's version number.

## used by

![Netflix](./docs/assets/logos/netflix.png)

## installation

**npm**

`npm install @better-builds/package-bundler -D`

**yarn**

`yarn add @better-builds/package-bundler -D`

**pnpm**

`pnpm add @better-builds/package-bundler -D`

## usage

```bash
turbo-tools [command]

Commands:
  turbo-tools version  Skips publishing and just version bumps packages in your
                       monorepo
  turbo-tools publish  Publishes packages in a Turborepo-powered Monorepo, and
                       optionally uses whichever custom Publish command you may
                       need (if overwritten in turboTools.config.js)
  turbo-tools run      Pass-through to Turborepo's run command
  turbo-tools init     Initializes a sane default configuration of config files
                       to work with the monorepo-tools
  turbo-tools ls       Lists all the packages in the monorepo, as detected
                       officially by NPM

Options:
  --version  Show version number                                       [boolean]
  --help     Show help                                                 [boolean]
```

### `version` command
Used to version bump each package in your repository. `alpha` and `beta` releases are treated as special cases, and a unique `git sha` value is appended to the generated / bumped version number.

```bash
npx turbo-tools version --help

Options:
      --version    Show version number                                 [boolean]
  -a, --all        If true, dirties all monorepo packages and thus, forces them
                   all to be version bumped and published
                                                      [boolean] [default: false]
  -d, --dryRun     If true, will perform all steps right up until publish, and
                   then output what would happen if publish were to continue
                                                      [boolean] [default: false]
      --releaseAs  Releases each changed package as this release type or as an
                   exact version. "major" "minor" "patch" "alpha" "beta" or an
                   exact semver version number are allowed.             [string]
  -y, --yes        If true, bypasses any prompts      [boolean] [default: false]
      --help       Show help                                           [boolean]
```

### `publish` command
Performs version bumping of your packages, and then attempts to publish said packages to whichever NPM registry you are using.


```bash
npx turbo-tools publish --help

Options:
      --version    Show version number                                 [boolean]
  -a, --all        If true, dirties all monorepo packages and thus, forces them
                   all to be version bumped and published
                                                      [boolean] [default: false]
  -d, --dryRun     If true, will perform all steps right up until publish, and
                   then output what would happen if publish were to continue
                                                      [boolean] [default: false]
      --releaseAs  Releases each changed package as this release type or as an
                   exact version. "major" "minor" "patch" "alpha" "beta" or an
                   exact semver version number are allowed.             [string]
  -y, --yes        If true, bypasses any prompts      [boolean] [default: false]
      --skipLint   If true, skips running the lint command across all changed
                   repositories before publishing     [boolean] [default: false]
      --skipTest   If true, skips running the test command across all changed
                   repositories before publishing     [boolean] [default: false]
      --help       Show help                                           [boolean]
```

### `run` command
This is a straight pass-through to `turbo run`, and accepts all the same values that [Turbo run does](https://turbo.build/repo/docs/reference/command-line-reference#turbo-run-task).

### `init` command
Set your repository up to use Turbo Repo with a set of sensible defaults (including generating a `turbo.json` file).

```bash
npx turbo-tools init --help

Options:
      --version    Show version number                                 [boolean]
      --help       Show help                                           [boolean]
  -n, --noPublish  If true, skips writing config files required for publishing
                   packages to NPM                    [boolean] [default: false]
  -d, --noDeps     If true, skips modifying your root package.json and
                   installing the missing dependencies required to power your
                   monorepo experience                [boolean] [default: false]
```

### `ls` command
Lists all of the packages that have been detected by the tools and NPM's workspace feature

```bash
npx turbo-tools ls --help

Options:
      --version  Show version number                                   [boolean]
      --help     Show help                                             [boolean]
  -j, --json     If true, prints resulting monorepo package information as JSON.
                 If false, prints the path to each package instead.
                                                      [boolean] [default: false]
```

## customizing behaviors

There are many cases where you might want to use Turbo Tools at your enterprise software organization, and might not be publishing packages to the public NPM registry. As such, you can customize which publish command is used for your use case, override guards for publishing, or merge additional contents into `package.json` files when you initialize your repository to work with Turbo and Turbo Tools. These can all be customized by placing a `turboTools.config.js` file at the root of your repository. To get typing and IDE assistance for this config, you can use the provided pass-through `defineConfig` function (see below). Not all of the options are required!

```javascript
const { defineTurboToolsConfig } = require('@better-builds/turbo-tools');

module.exports = defineTurboConfig({
  init: {
    // Will be called for every child package that exists in the monorepo when "init" is called.
    // You can completely customize the contents and they will be merged in with Turbo Tools' defaults
    addToPackageJson({ monorepoRoot, noDeps, noPublish, whichPackageManager }) {
      return {
        somethingCustom: new Date().toISOString(),
      };
    },
  },
  publish: {
    // you can perform some async operation here if you'd like to check whether
    // a publish should continue or not
    async checkCanPublish({ all, dryRun, releaseAs, packagePath, publishTag, yes }) {
      return true;
    },

    // if you need to use something other than "npm publish" for publishing your packages,
    // you can construct the command and its arguments here and return them to have Turbo Tools
    // call the command when publishing each package in the repository
    getCommand({ all, dryRun, releaseAs, publishTag, yes }) {
      const cmd = 'custom-publish-command';
      const args = ['publish'];
      if (releaseAs) args.push('--release-as', releaseAs);
      if (dryRun) args.push('--dry-run');
      if (publishTag) args.push('--tag', publishTag);
      args.push('--no-commit', '--no-push', '--no-publish-confirm');

      return { args, cmd };
    },
  },
});
```

## contributing

This repository was built using Node `18.13.0` and `npm 9.3.0`. Please be sure you have those installed before contributing and issuing a PR. To get started, run `./repo-setup.sh` to bootstrap the repository. All contributions are welcome, thanks!

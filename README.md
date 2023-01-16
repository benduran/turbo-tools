# turbo-tools
A collection of TurboRepo CLI tools to test, lint, build, version and publish packages in your Turborepo monorepo

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

Documentation coming soon 🤞

## contributing

This repository was built using Node `18.13.0` and `npm 9.3.0`. Please be sure you have those installed before contributing and issuing a PR. To get started, run `./repo-setup.sh` to bootstrap the repository. All contributions are welcome, thanks!

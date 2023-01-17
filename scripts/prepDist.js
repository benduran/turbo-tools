#!/usr/bin/env node

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs-extra');

const tsconfigPath = path.join(__dirname, '../tsconfig.json');
const distDir = path.join(__dirname, '../dist');

// 1. Remove old build
execSync(`rm -rf ${distDir}`);

// 2. Compile src via TSC
execSync(`tsc --project ${tsconfigPath}`, { stdio: 'inherit' });

// 3. Read the package.json
const pjsonPath = path.join(__dirname, '../package.json');
const pjson = JSON.parse(fs.readFileSync(pjsonPath, 'utf-8'));

// 4. Cleanup package.json items that aren't needed
delete pjson.scripts;

// 5. Write package.json to the dist folder because we publish from *inside* the distDir
fs.writeFileSync(path.join(distDir, 'package.json'), JSON.stringify(pjson, null, 2), 'utf-8');

// 6. Copy the Readme to dist
fs.createReadStream(path.join(__dirname, '../README.md')).pipe(fs.createWriteStream(path.join(distDir, 'README.md')));

// 7. Copy the License over
fs.createReadStream(path.join(__dirname, '../LICENSE')).pipe(fs.createWriteStream(path.join(distDir, 'LICENSE')));

// 8. Copy the templates for the init command
fs.copySync(path.join(__dirname, '../', 'src', 'templates'), path.join(distDir, 'templates'));

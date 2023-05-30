#!/bin/bash

if [ "$CI" != "" ]; then
  npm ci
else
  npm install
fi

npx husky install

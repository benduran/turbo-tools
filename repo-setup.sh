#!/bin/bash

if [ "$CI" != "" ]; then
  bun i --frozen-lockfile
else
  bun i
fi

bun husky install

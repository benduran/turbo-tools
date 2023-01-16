#!/bin/bash

set -ex

CMD_TO_RUN="npx monorepo-tools publish --yes"

if [ $PUBLISH_DRY_RUN == true ]; then
  CMD_TO_RUN="$CMD_TO_RUN --dryRun"
fi

if [ "$PUBLISH_RELEASE_AS" != "" ]; then
  CMD_TO_RUN="$CMD_TO_RUN --releaseAs $PUBLISH_RELEASE_AS"
fi

eval $CMD_TO_RUN

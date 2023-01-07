#!/bin/bash

# Update package docs just before a release.
#
# Usage: ./development.sh PREV_RELEASE_VERSION

test -z "$(git status --untracked-files=no --porcelain)" || echo 'git repo must be clean' && exit 1

PREV_RELEASE_VERSION=$1

if [[ $PREV_RELEASE_VERSION == "" ]]; then
    echo "PREV_RELEASE_VERSION must be provided, e.g., 0.4.3"
    exit 1
fi

sed -zri "s/\n::: \{\.callout\}\nNew in v$PREV_RELEASE_VERSION\n:::\n//g" vignettes/*.Rmd
sed -zri "s/ \(new in v$PREV_RELEASE_VERSION\)//g" vignettes/*.Rmd
sed -zri "s/, new in v$PREV_RELEASE_VERSION//g" vignettes/*.Rmd

git commit -am "Remove old new version callouts from $PREV_RELEASE_VERSION"

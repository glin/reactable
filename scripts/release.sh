#!/bin/bash

# Bump package version for a release.
#
# Usage: ./development.sh RELEASE_VERSION

test -z "$(git status --untracked-files=no --porcelain)" || echo 'git repo must be clean' && exit 1

RELEASE_VERSION=$1

if [[ $RELEASE_VERSION == "" ]]; then
    echo "RELEASE_VERSION must be provided, e.g., 0.4.3"
    exit 1
fi

PREV_VERSION=$(cat DESCRIPTION | grep 'Version:' | sed 's/Version: //')

git checkout main
git checkout -b "v$RELEASE_VERSION"

sed -ri "s/$PREV_VERSION/$RELEASE_VERSION/" DESCRIPTION
sed -ri "s/$PREV_VERSION/$RELEASE_VERSION/" inst/htmlwidgets/reactable.yaml
sed -ri "s/v$PREV_VERSION( \(unreleased\))?/v$RELEASE_VERSION/g" vignettes/*.Rmd
sed -ri "s/$PREV_VERSION( \(unreleased\))?/$RELEASE_VERSION/gi" NEWS.md
sed -ri "s/v$PREV_VERSION/v$RELEASE_VERSION/g" R/*.R srcjs/*.js

git commit -am "Bump version to ${RELEASE_VERSION}"

echo "
Review the changes, then run:

git push origin v${RELEASE_VERSION}"

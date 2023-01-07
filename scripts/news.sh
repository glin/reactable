#!/bin/bash

# Print latest release version NEWS without wrapping for a GitHub release.
#
# Usage: ./news.sh RELEASE_VERSION

RELEASE_VERSION=$1

if [[ $RELEASE_VERSION == "" ]]; then
    echo "RELEASE_VERSION must be provided, e.g., 0.4.3"
    exit 1
fi

./node_modules/.bin/prettier NEWS.md --print-width=9999 --prose-wrap always | sed -zr -e "s/.*# reactable ${RELEASE_VERSION}\n\n//" -e "s/\n\n# reactable.+//"

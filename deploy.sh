#!/bin/bash

cd "$(dirname "$0")"

echo "Building distribution..."
yarn build

echo "Creating upload zipfile..."
rm function.zip 
zip -r function.zip \
    package.json \
    index.js \
    dist/* \
    node_modules/* --exclude 'node_modules/@aws-sdk/*'

echo "Deploying to Lambda..."
aws lambda update-function-code --function-name agentic-profile-node-service --zip-file fileb://function.zip --profile agentic

echo "Done!"
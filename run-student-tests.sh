#!/bin/bash

echo "Running Student Routes Tests..."
NODE_ENV=test npx mocha test/student-routes.test.js --timeout 10000 --exit

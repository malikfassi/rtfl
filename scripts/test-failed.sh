#!/bin/bash

# Test Failed Tests Script
# This script runs tests and shows only failed tests with detailed output

echo "🧪 Running tests and showing only failures..."
echo "=============================================="

# Create test-results directory if it doesn't exist
mkdir -p test-results

# Run tests with failed-only configuration
if [ "$1" = "log" ]; then
    echo "📝 Logging failed tests to test-results/failed-tests-detailed.log"
    npm run test:failed:config:log
    echo "✅ Failed tests logged to test-results/failed-tests-detailed.log"
    echo "📊 Also check test-results/failed-tests.xml for XML format"
else
    echo "🔍 Running tests with failed-only output..."
    npm run test:failed:config
fi

echo "=============================================="
echo "🎯 Done! Check the output above for failed tests." 
#!/bin/bash
# Deployment scripts for CodePipeline.
# Takes two positional arguments: 
# - file path to an environmet.json containing env variables.
# - the name IAM role for claudia's lambda function to assume.

# Positional arguments
JSON=$1
ROLE=$2

# Make sure both arguments are present before executing.
if [ -n "$JSON" ] && [[ -n "$ROLE" ]]; then
    TMPDIR=/tmp claudia create\
     --handler lambda.handler \
     --deploy-proxy-api \
     --region us-east-1 \
     --set-env-from-json $JSON \
     --role $ROLE
else
    echo "argument error"
fi


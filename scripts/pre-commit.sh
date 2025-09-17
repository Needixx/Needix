#!/usr/bin/env bash

# Block common secret patterns in staged changes
if git diff --cached | grep -E 'sk_(test|live)_[0-9A-Za-z]+' -q; then
  echo "❌ ERROR: Found a Stripe secret key in staged changes. Remove it before committing."
  exit 1
fi

if git diff --cached | grep -E 'whsec_[0-9A-Za-z]+' -q; then
  echo "❌ ERROR: Found a Stripe webhook secret in staged changes. Remove it before committing."
  exit 1
fi

if git diff --cached | grep -E 're_[0-9A-Za-z]{20,}' -q; then
  echo "❌ ERROR: Found a Resend API key in staged changes. Remove it before committing."
  exit 1
fi

# If nothing bad found
exit 0

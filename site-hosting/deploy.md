# Deploy

## Prerequisites

- Typical web dev requirements like Node and Git.
- Install the Firebase CLI.
- Log into Firebase with `firebase login`.
- Make sure you have `staging` and `production` branches and can push to those branches, they are needed by the script below.

## Deploy Steps

- Commit all changes to the `main` branch.
- Run `node site-hosting/site-build-staging.js` to deploy to staging.
- Confirm that the staging site works before continuing (The console output will give the staging URL).
- Run `node site-hosting/site-build-production.js` to deploy to production.

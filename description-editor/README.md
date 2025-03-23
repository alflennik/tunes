# Description Editor

## Starting the Editor

In the description-editor/server directory:
- Run `npm install`.
- Add files containing secret keys:
  - "secretAzureKey.txt": a key with authorization to run the Cognitive Voice API in Azure.
  - "secretYouTubeKey.txt": a key for the YouTube Data API.
  - "secretGithubApp.txt": the key for a GitHub Oauth app.
  - "secretGithubPAT.txt": the key for a GitHub personal access token.
  - "secretJwt.txt": generate any random string of characters to put here.

In the description-editor/client directory:
- Run `npm install`.

In the description-editor directory, run:

```
node index.js
```

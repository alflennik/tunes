- First update fullContent.json by using Node to run getFullContent.js
- Copy the contents of fullContent.json
- In a browser console, write the following:

```js
const fullContent = /* <paste in the full content> */
```

- Write the following:

```js
copy(
  JSON.stringify(
    Object.fromEntries(
      fullContent
        .filter(({ supportsEmbedding }) => supportsEmbedding)
        .map(({ id, durationSeconds, aspectRatio }) => {
          return [id, [durationSeconds, aspectRatio]]
        })
    )
  )
)
```

- Paste the copied data into /video-channels/videos.json
- Update getApp.js to include any new properties you added

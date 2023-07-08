/*
Should define:
- Equivalence
- Component file paths
- Associated object for justChanged
- All keywords
*/
defineGraph(
  "tunes",
  (() => {
    const audioDescription = {
      type: "component",
      filePath: "./audioDescription.js",
      share: (() => {
        const description = {
          type: "object",
          required: false,
          compare: "content",
          fields: {
            text: { type: "string", required: true, compare: "content" },
            time: { type: "number", required: true, compare: "content" },
          },
        }

        const descriptions = {
          type: "array",
          required: true,
          compare: "throw",
          items: {
            type: "object",
            fields: description.fields,
          },
        }

        const analysis = {
          type: "object",
          required: false,
          compare: "content",
          fields: { text: description.fields.text },
        }

        const spokenItem = {
          type: "object",
          required: false,
          compare: "content",
          fields: {
            text: description.fields.text,
            time: { ...descriptions.fields.time, required: false },
          },
        }

        const playMode = {
          type: "string",
          required: true,
          compare: "content",
          allowedValues: ["playing", "paused", "ended"],
        }

        return { descriptions, description, analysis, spokenItem, playMode }
      })(),
    }

    const contentBrowser = {
      type: "component",
      filePath: "./audioDescription.js",
      share: (() => {
        const video = {
          type: "object",
          required: true,
          compare: "id",
          fields: {
            id: { type: "string", required: true, compare: "content" },
            // artist: { type: ''}
            // title
            // videoType
            // videoTypeCustomLabel
            // thumbnailSrc
            // thumbnailAlt
            // youtubeId
            // descriptionPath
          },
        }

        const playlist = {
          type: "object",
          required: false,
          compare: "id",
          fields: {
            id: { type: "string", required: true, compare: "content" },
            title: { type: "string", required: true, compare: "content" },
            videos: {
              type: "array",
              required: true,
              compare: "throw",
              items: { type: "object", fields: video.fields },
            },
          },
        }

        const playlists = {
          type: "array",
          required: true,
          compare: "throw",
          items: { type: "object", fields: playlist.fields },
        }

        const select = {
          type: "function",
          parameters: [
            {
              type: "object",
              fields: {
                playlist: { type: "object", fields: playlist.fields },
                video: { type: "object", fields: video.fields },
                getRequired: ({ playlist, video }) => playlist || video,
              },
            },
          ],
        }

        return { playlists, playlist, video, select }
      })(),
    }

    return { audioDescription, contentBrowser }
  })()
)

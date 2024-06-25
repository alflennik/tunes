const getVideoPlayer = ({
  node,
  startsMuted = false,
  getVideo,
  getStartSeconds = () => undefined,
  onEnd = null,
  listenForChange = null,
}) => {
  node.innerHTML = /* HTML */ `<style>
      #youtube-player {
        width: 100%;
      }
    </style>
    <div id="youtube-player"></div> `

  getYouTubePlayer({
    youtubePlayerId: "youtube-player",
    startsMuted,
    getVideoId: () => getVideo().id,
    getStartSeconds,
    listenForChange,
    onEnd,
  })
}

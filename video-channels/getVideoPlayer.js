const getVideoPlayer = ({
  node,
  startsMuted,
  getVideo,
  getStartSeconds,
  onEnd,
  listenForChange = null,
}) => {
  node.innerHTML = /* HTML */ ` <div id="youtube-player"></div> `

  getYouTubePlayer({
    youtubePlayerId: "youtube-player",
    startsMuted,
    getVideoId: () => getVideo().id,
    getStartSeconds,
    listenForChange,
    onEnd,
  })
}

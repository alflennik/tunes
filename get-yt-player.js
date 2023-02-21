let resolveIsPlayerReady;
let isPlayerReadyPromise = new Promise((resolve) => {
  resolveIsPlayerReady = resolve;
});

const getYouTubePlayerOnce = async ({ videoId }) => {
  if (getYouTubePlayerOnce.isDone) return;

  var scriptElement = document.createElement("script");
  scriptElement.src = "https://www.youtube.com/iframe_api";
  var firstScriptTag = document.getElementsByTagName("script")[0];
  firstScriptTag.parentNode.insertBefore(scriptElement, firstScriptTag);

  await isPlayerReadyPromise;

  getYouTubePlayerOnce.isDone = true;

  return new YT.Player("player", {
    height: "315",
    width: "560",
    videoId,
    playerVars: {
      playsinline: 1,
    },
  });
};

function onYouTubeIframeAPIReady() {
  resolveIsPlayerReady();
}

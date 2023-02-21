import define from "../utilities/define.js";

export default class YouTubePlayer extends HTMLElement {
  #player;

  constructor() {
    super();
  }

  initializeState = {
    intervalId: null,
  };

  initializeActions = {
    onYouTubeChange: (eventData) => {
      const { onUpdateTime } = this.bindings;
      const { intervalId } = this.state;
      const { setIntervalId } = this.stateSetters;

      if (eventData === YT.PlayerState.PLAYING && !intervalId) {
        const intervalId = setInterval(() => {
          const seconds = this.#player.getCurrentTime();
          onUpdateTime(seconds);
          console.log(Math.round(seconds * 1000) / 1000);
        }, /* 20 */ 800);

        setIntervalId(intervalId);
      } else if (intervalId) {
        clearInterval(intervalId);
        setIntervalId(null);
      }
    },
  };

  async connectedCallback() {
    const { videoId, onReady } = this.bindings;
    const { onYouTubeChange } = this.actions;

    this.innerHTML = `<div id="player"></div>`;

    this.#player = await getYouTubePlayerOnce({ videoId });

    this.#player.addEventListener("onReady", () => {
      onReady();
    });

    this.#player.addEventListener("onStateChange", (event) => {
      onYouTubeChange(event.data);
    });
  }

  play() {
    this.#player.playVideo();
  }
}

define({ "youtube-player": YouTubePlayer });

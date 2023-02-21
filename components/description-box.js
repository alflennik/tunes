import define from "../utilities/define.js";
import { div } from "../utilities/fun-html.js";

export default class DescriptionBox extends HTMLElement {
  constructor() {
    super();
  }

  initializeState = {
    descriptions: null,
    currentDescriptionText: "",
    previousTime: null,
  };

  initializeActions = {
    fetchDescriptions: async () => {
      const { videoId, onReady } = this.bindings;
      const { setDescriptions } = this.stateSetters;

      const descriptionModule = await import(`../descriptions/${videoId}.js`);
      setDescriptions(descriptionModule.default.descriptions);

      const { descriptions } = this.state;

      onReady(descriptions);
    },

    handleTimeChange: () => {
      const { time } = this.bindings;
      const { descriptions, currentDescriptionText } = this.state;
      const { say } = this.utilities;
      const { setPreviousTime, setCurrentDescriptionText } = this.stateSetters;

      setPreviousTime(time);

      if (!descriptions) return;

      let description;
      for (let i = descriptions.length - 1; i >= 0; i -= 1) {
        if (time > descriptions[i].time) {
          description = descriptions[i];
          break;
        }
      }

      if (description && description.text !== currentDescriptionText) {
        setCurrentDescriptionText(description.text);
        say(description.text);
      }
    },
  };

  utilities = {
    say: (text) => {
      const utterThis = new SpeechSynthesisUtterance(text);
      utterThis.pitch = 1;
      utterThis.rate = 1.7;
      window.speechSynthesis.speak(utterThis);
    },
  };

  async connectedCallback() {
    const { fetchDescriptions } = this.actions;
    await fetchDescriptions();
  }

  reactiveTemplate() {
    const { time } = this.bindings;
    const { previousTime, currentDescriptionText } = this.state;
    const { handleTimeChange } = this.actions;

    if (time && time != previousTime) handleTimeChange(time);

    return div(currentDescriptionText);
  }
}

define({ DescriptionBox });

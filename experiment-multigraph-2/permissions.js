define("permissions", function () {
  const onFirstInteraction = receive("onFirstInteraction")

  once("initialize", () => {
    this.firstInteractionComplete = false
  })
})

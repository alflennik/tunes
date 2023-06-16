if (isTruthy(getVariable("video").read("justChanged").callFunction())) {
  throw stop(defineGraph().setPair("fetchDescriptions", getVariable("fetchDescriptions")))
}

setVariable(
  "description",
  getVariable("descriptions")
    .read("reverse")
    .callFunction()
    .read("find")
    .callFunction(
      defineFunction()
        .setParameter("each")
        .setBody(() => {
          return isGreaterThan(getVariable("time"), getVariable("each").read("time"))
        })
    )
)

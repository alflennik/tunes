const { createObservable, onObservableChanges, groupObservableUpdates } = require("./index")

const tests = {}

tests["basic observable"] = () => {
  const firstNameObservable = createObservable("John")
  const lastNameObservable = createObservable("Smithy")

  const fullNameObservable = createObservable()
  onObservableChanges([firstNameObservable, lastNameObservable], () => {
    fullNameObservable.update(`${firstNameObservable.getValue()} ${lastNameObservable.getValue()}`)
  })

  const john = fullNameObservable.getValue()

  firstNameObservable.update("Jane")

  const jane = fullNameObservable.getValue()

  if (john !== "John Smithy" || jane !== "Jane Smithy") {
    throw new Error("Failed")
  }
}

tests["basic groupObservableUpdates and onObservableChanges"] = () => {
  const stateObservable = createObservable("New York")
  const cityObservable = createObservable("Buffalo")

  let location
  onObservableChanges([stateObservable, cityObservable], () => {
    location = `${cityObservable.getValue()}, ${stateObservable.getValue()}`
  })

  const buffaloNewYork = location

  groupObservableUpdates(() => {
    stateObservable.update("Maine")
    cityObservable.update("Portland")
  })

  const portlandMaine = location

  stateObservable.update("Oregon")

  const portlandOregon = location

  if (
    buffaloNewYork !== "Buffalo, New York" ||
    portlandMaine !== "Portland, Maine" ||
    portlandOregon !== "Portland, Oregon"
  ) {
    throw new Error("Failed")
  }
}

tests["nested groupObservableUpdates"] = () => {
  const userObservable = createObservable()
  const organizationObservable = createObservable()

  const startSession = () => {
    groupObservableUpdates(() => {
      userObservable.update({ username: "california_king_69" })
      organizationObservable.update({ name: "Balloons By Bob" })
    })
  }

  const endSession = () => {
    groupObservableUpdates(() => {
      userObservable.update(null)
      organizationObservable.update(null)
    })
  }

  const currentPageObservable = createObservable()
  const currentTitleObservable = createObservable()

  const navigateTo = url => {
    groupObservableUpdates(() => {
      switch (url) {
        case "/":
          currentPageObservable.update("home")
          currentTitleObservable.update("Dashboard")
        case "/login":
          currentPageObservable.update("login")
          currentTitleObservable.update("Please Sign In")
      }
    })
  }

  let onChangeTriggerCount = 0
  onObservableChanges(
    [userObservable, organizationObservable, currentPageObservable, currentTitleObservable],
    () => {
      onChangeTriggerCount += 1
    }
  )

  const reset = () => {
    startSession()
    navigateTo("/")
    onChangeTriggerCount = 0
  }

  const signOutFlowUngrouped = () => {
    reset()

    endSession()
    const intermediateCount = onChangeTriggerCount
    navigateTo("/login")
    const finalCount = onChangeTriggerCount

    return { intermediateCount, finalCount }
  }

  const signOutFlowGrouped = () => {
    reset()

    let intermediateCount
    groupObservableUpdates(() => {
      endSession()
      intermediateCount = onChangeTriggerCount
      navigateTo("/login")
    })
    const finalCount = onChangeTriggerCount

    return { intermediateCount, finalCount }
  }

  const ungroupedResult = signOutFlowUngrouped()
  const groupedResult = signOutFlowGrouped()

  if (
    groupedResult.intermediateCount !== 0 ||
    ungroupedResult.finalCount !== groupedResult.finalCount
  ) {
    console.info("ungroupedResult", ungroupedResult)
    console.info("groupedResult", groupedResult)
    throw new Error("Failed")
  }
}

try {
  Object.values(tests).forEach(test => test())
} catch (error) {
  console.error("✕ Test Suite Failed")
  console.error(error)
  process.exit(1)
}

console.info("✓ All tests passed")

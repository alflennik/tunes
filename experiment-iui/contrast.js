const perfectStudent = (() => {
  let result
  schools.each(school => {
    school.classes.each(schoolClass => {
      schoolClass.students.each(student => {
        if (student.averageGrade === 4) {
          result = student
        }
      })
    })
  })
  return student
})()

const getArticle = async () => {
  let article = ""

  while (true) {
    if (stream.isDone()) return article
    article += await stream.loadChunk()
  }
}

const getProfilePage = () => {
  // prettier-ignore
  return createHtmlTemplate([
    { h1: "Profile" },
    { div: `Username: ${user.username}` }
  ])
}

const unpopulatedVideos = await getVideos().parseJson()
//

const buildingHeights = [5, 7, 2, 1]

const answer = (() => {
  let largestHeightSoFar = 0

  for (const height of buildingHeights.toReversed()) {
    if (height > largestHeightSoFar) {
      largestHeightSoFar = height
    } else {
      return buildingHeights.length - index - 1
    }
  }
})()

console.log(answer)

const toSentence = list => {
  return `${list.slice(0, -1).join(", ")} and ${list.slice(-1)}`
}

const formatTitle = (video, { titleStyle = "standard" } = {}) => {
  let featuredArtistFormatted
  if (titleStyle === "standard") {
    const featuredList = video.featuredArtists?.join(", ") ?? video.featuredArtist ?? ""
    featuredArtistFormatted = featuredList ? `feat. ${featuredList}` : ""
  } else if (titleStyle === "listenable") {
    let featuredList
    if (video.featuredArtists) {
      featuredList = toSentence(video.featuredArtists)
    } else {
      featuredList = video.featuredArtist ?? ""
    }
    featuredArtistFormatted = featuredList ? `featuring ${featuredList}` : ""
  }

  let videoTypeFormatted
  if (video.videoTypeCustomLabel) {
    videoTypeFormatted = video.videoTypeCustomLabel
  } else if (video.videoType === "musicVideo") {
    videoTypeFormatted = "" // It's like the default
  } else if (video.videoType === "livePerformance") {
    videoTypeFormatted = "Live"
  }

  const inParens = text => (text ? `(${text})` : "")

  let finalTitle
  if (titleStyle === "standard") {
    finalTitle = [
      video.artist,
      "-",
      video.title,
      inParens(featuredArtistFormatted),
      inParens(videoTypeFormatted)
    ]
      .filter(item => !!item)
      .join(" ")
  } else if (titleStyle === "listenable") {
    finalTitle = [
      video.title,
      "by",
      video.artist,
      featuredArtistFormatted,
      inParens(videoTypeFormatted)
    ]
      .filter(item => !!item)
      .join(" ")
  }
  return finalTitle
}

export default formatTitle

const toSentence = (list) => {
  return `${list.slice(0, -1).join(", ")} and ${list.slice(-1)}`
}

const formatTitle = (song, { titleStyle = "standard" } = {}) => {
  let featuredArtistFormatted
  if (titleStyle === "standard") {
    const featuredList = song.featuredArtists?.join(", ") ?? song.featuredArtist ?? ""
    featuredArtistFormatted = featuredList ? `feat. ${featuredList}` : ""
  } else if (titleStyle === "listenable") {
    let featuredList
    if (song.featuredArtists) {
      featuredList = toSentence(song.featuredArtists)
    } else {
      featuredList = song.featuredArtist ?? ""
    }
    featuredArtistFormatted = featuredList ? `featuring ${featuredList}` : ""
  }

  let videoTypeFormatted
  if (song.videoTypeCustomLabel) {
    videoTypeFormatted = song.videoTypeCustomLabel
  } else if (song.videoType === "musicVideo") {
    videoTypeFormatted = "" // It's like the default
  } else if (song.videoType === "livePerformance") {
    videoTypeFormatted = "Live"
  }

  const inParens = (text) => (text ? `(${text})` : "")

  let finalTitle
  if (titleStyle === "standard") {
    finalTitle = [
      song.artist,
      "-",
      song.title,
      inParens(featuredArtistFormatted),
      inParens(videoTypeFormatted),
    ]
      .filter((item) => !!item)
      .join(" ")
  } else if (titleStyle === "listenable") {
    finalTitle = [
      song.title,
      "by",
      song.artist,
      featuredArtistFormatted,
      inParens(videoTypeFormatted),
    ]
      .filter((item) => !!item)
      .join(" ")
  }
  return finalTitle
}

export default formatTitle

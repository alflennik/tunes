const formatTitle = (song, { titleStyle = "standard" } = {}) => {
  let featuredArtistFormatted = song.featuredArtist ? `feat. ${song.featuredArtist}` : ""
  if (titleStyle === "standard") {
    featuredArtistFormatted = song.featuredArtist ? `feat. ${song.featuredArtist}` : ""
  } else if (titleStyle === "listenable") {
    featuredArtistFormatted = song.featuredArtist ? `featuring ${song.featuredArtist}` : ""
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
      featuredArtistFormatted,
      "-",
      song.title,
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

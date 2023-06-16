const fetchPlaylists = async ({ complete }) => {
  const playlistListModule = await import(`../playlists/playlist-list.js`)
  const playlistList = playlistListModule.default
  const playlists = await Promise.all(
    playlistList.map(async playlistPath => {
      const playlistModule = await import(`../playlists/${playlistPath}/contents.js`)
      return playlistModule.default
    })
  )
  complete("fetchPlaylists", playlists)
}

export default fetchPlaylists

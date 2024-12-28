import SpotifyWebApi from "spotify-web-api-node";

// Initialize Spotify API client
const spotifyApi = new SpotifyWebApi({
  clientId: process.env.SPOTIFY_CLIENT_ID,
  clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
  redirectUri: process.env.SPOTIFY_REDIRECT_URI,
  refreshToken: process.env.SPOTIFY_REFRESH_TOKEN,
});

export async function getTrack(id) {
  return await spotifyApi.getTrack(id);
}

export async function refreshAccessToken() {
  const data = await spotifyApi.refreshAccessToken();
  spotifyApi.setAccessToken(data.body["access_token"]);
}

export async function createPlaylist(name, description) {
  const response = await spotifyApi.createPlaylist(name, {
    description: description,
    public: false,
  });
  return response.body.id;
}

export async function getAllSavedTracks() {
  let tracks = [];
  let offset = 0;
  const limit = 50;

  while (true) {
    const data = await spotifyApi.getMySavedTracks({
      limit: limit,
      offset: offset,
    });

    if (data.body.items.length === 0) break;

    tracks = tracks.concat(data.body.items);
    offset += limit;
    console.log(`Fetched ${tracks.length} tracks so far...`);
  }

  return tracks;
}

export async function addTracksToPlaylist(playlistId, trackUris) {
  // Spotify API has a limit of 100 tracks per request
  for (let i = 0; i < trackUris.length; i += 100) {
    const chunk = trackUris.slice(i, i + 100);
    await spotifyApi.addTracksToPlaylist(playlistId, chunk);
    console.log(
      `Added ${i + chunk.length}/${trackUris.length} tracks to playlist`
    );
  }
}

export async function removeSavedTracks(trackIds) {
  // Remove tracks in chunks of 50
  for (let i = 0; i < trackIds.length; i += 50) {
    const chunk = trackIds.slice(i, i + 50);
    await spotifyApi.removeFromMySavedTracks(chunk);
    console.log(`Removed ${i + chunk.length}/${trackIds.length} tracks`);
  }
}

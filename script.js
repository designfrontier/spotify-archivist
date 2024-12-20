import "dotenv/config";
import SpotifyWebApi from "spotify-web-api-node";
import yargs from "yargs";
import { hideBin } from "yargs/helpers";

const argv = yargs(hideBin(process.argv))
  .option("clear-likes", {
    type: "boolean",
    description: "Only clear liked songs without creating playlists",
    default: false,
  })
  .option("year", {
    type: "number",
    description: "Process only songs from a specific year",
    default: null,
  })
  .option("start-year", {
    type: "number",
    description: "Start processing from this year",
    default: null,
  })
  .option("end-year", {
    type: "number",
    description: "End processing at this year",
    default: null,
  })
  .help().argv;

// Initialize Spotify API client
const spotifyApi = new SpotifyWebApi({
  clientId: process.env.SPOTIFY_CLIENT_ID,
  clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
  redirectUri: process.env.SPOTIFY_REDIRECT_URI,
  refreshToken: process.env.SPOTIFY_REFRESH_TOKEN,
});

async function refreshAccessToken() {
  const data = await spotifyApi.refreshAccessToken();
  spotifyApi.setAccessToken(data.body["access_token"]);
}

async function getAllSavedTracks() {
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

async function createPlaylist(name, description) {
  const response = await spotifyApi.createPlaylist(name, {
    description: description,
    public: false,
  });
  return response.body.id;
}

async function addTracksToPlaylist(playlistId, trackUris) {
  // Spotify API has a limit of 100 tracks per request
  for (let i = 0; i < trackUris.length; i += 100) {
    const chunk = trackUris.slice(i, i + 100);
    await spotifyApi.addTracksToPlaylist(playlistId, chunk);
    console.log(
      `Added ${i + chunk.length}/${trackUris.length} tracks to playlist`
    );
  }
}

async function removeSavedTracks(trackIds) {
  // Remove tracks in chunks of 50
  for (let i = 0; i < trackIds.length; i += 50) {
    const chunk = trackIds.slice(i, i + 50);
    await spotifyApi.removeFromMySavedTracks(chunk);
    console.log(`Removed ${i + chunk.length}/${trackIds.length} tracks`);
  }
}

function groupTracksByYear(savedTracks) {
  const tracksByYear = {};
  savedTracks.forEach((item) => {
    const savedAt = new Date(item.added_at);
    const year = savedAt.getFullYear();

    if (!tracksByYear[year]) {
      tracksByYear[year] = [];
    }

    tracksByYear[year].push({
      uri: item.track.uri,
      id: item.track.id,
    });
  });
  return tracksByYear;
}

function filterTracksByYearRange(tracksByYear) {
  const filteredTracks = {};
  const years = Object.keys(tracksByYear)
    .map(Number)
    .sort((a, b) => a - b);

  if (argv.year) {
    // Single year mode
    if (tracksByYear[argv.year]) {
      filteredTracks[argv.year] = tracksByYear[argv.year];
    }
  } else if (argv.startYear || argv.endYear) {
    // Year range mode
    const startYear = argv.startYear || Math.min(...years);
    const endYear = argv.endYear || Math.max(...years);

    years.forEach((year) => {
      if (year >= startYear && year <= endYear) {
        filteredTracks[year] = tracksByYear[year];
      }
    });
  } else {
    // All years
    return tracksByYear;
  }

  return filteredTracks;
}

async function organizeTracks(savedTracks) {
  const tracksByYear = groupTracksByYear(savedTracks);
  const filteredTracks = filterTracksByYearRange(tracksByYear);

  // Log year summary
  console.log("\nYear Summary:");
  Object.entries(filteredTracks).forEach(([year, tracks]) => {
    console.log(`${year}: ${tracks.length} tracks`);
  });

  // Create playlists for each year
  for (const [year, tracks] of Object.entries(filteredTracks)) {
    try {
      console.log(`\nProcessing ${year}...`);
      console.log(`Creating playlist for ${year} with ${tracks.length} tracks`);

      const playlistName = `Liked Songs ${year}`;
      const playlistDescription = `Liked songs from ${year}`;

      const playlistId = await createPlaylist(
        playlistName,
        playlistDescription
      );
      await addTracksToPlaylist(
        playlistId,
        tracks.map((t) => t.uri)
      );

      console.log(`Completed playlist: ${playlistName}`);
    } catch (error) {
      console.error(`Error processing year ${year}:`, error.message);
      console.error("Skipping to next year...");
    }
  }
}

async function main() {
  try {
    // Refresh access token first
    await refreshAccessToken();

    // Get all saved tracks
    console.log("Fetching saved tracks...");
    const savedTracks = await getAllSavedTracks();
    console.log(`Found ${savedTracks.length} saved tracks total`);

    if (argv.clearLikes) {
      // Only clear likes if the flag is set
      console.log("Clearing liked songs...");
      const trackIds = savedTracks.map((item) => item.track.id);
      await removeSavedTracks(trackIds);
      console.log("Liked songs cleared");
    } else {
      // Create playlists by year if not clearing likes
      await organizeTracks(savedTracks);
      console.log("\nAll specified playlists created successfully!");
    }
  } catch (error) {
    console.error("Error:", error.message);
    process.exit(1);
  }
}

main();

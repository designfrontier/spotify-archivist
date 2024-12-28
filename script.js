import "dotenv/config";
import yargs from "yargs";
import { hideBin } from "yargs/helpers";
import { analyze, analyzeTracks } from "./modules/analyze.js";
import {
  refreshAccessToken,
  createPlaylist,
  getAllSavedTracks,
  addTracksToPlaylist,
  removeSavedTracks,
} from "./modules/spotify.js";
import {
  groupTracksByYear,
  filterTracksByYearRange,
} from "./modules/organize.js";

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
  .option("analyze", {
    type: "boolean",
    description: "Fetch lyrics and perform sentiment analysis",
    default: false,
  })
  .help().argv;

async function organizeTracks(savedTracks) {
  const tracksByYear = groupTracksByYear(savedTracks);
  const filteredTracks = filterTracksByYearRange(tracksByYear, argv);

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

    if (argv.analyze) {
      // Perform analysis if requested
      await analyze(savedTracks, argv);
    } else if (argv.clearLikes) {
      // Only clear likes if the flag is set
      console.log("Clearing liked songs...");
      const trackIds = savedTracks.map((item) => item.track.id);
      await removeSavedTracks(trackIds);
      console.log("Liked songs cleared");
    } else {
      // Create playlists by year if not clearing likes or analyzing
      await organizeTracks(savedTracks);
      console.log("\nAll specified playlists created successfully!");
    }
  } catch (error) {
    console.error("Error:", error.message);
    process.exit(1);
  }
}

main();

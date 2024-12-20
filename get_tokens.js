import "dotenv/config";
import express from "express";
import SpotifyWebApi from "spotify-web-api-node";
import { fileURLToPath } from "url";
import { dirname } from "path";
import open from "open";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const port = 8888;

// Create .env file with your client ID and secret from Spotify Developer Dashboard
const spotifyApi = new SpotifyWebApi({
  clientId: process.env.SPOTIFY_CLIENT_ID,
  clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
  redirectUri: `http://localhost:${port}/callback`,
});

// Required scopes for the playlist organizer
const scopes = [
  "user-library-read",
  "user-library-modify",
  "playlist-modify-private",
];

app.get("/login", (req, res) => {
  res.redirect(spotifyApi.createAuthorizeURL(scopes));
});

app.get("/callback", async (req, res) => {
  const { code } = req.query;

  try {
    const data = await spotifyApi.authorizationCodeGrant(code);
    const { access_token, refresh_token } = data.body;

    console.log("\nAdd these tokens to your .env file:\n");
    console.log(`SPOTIFY_ACCESS_TOKEN=${access_token}`);
    console.log(`SPOTIFY_REFRESH_TOKEN=${refresh_token}`);

    res.send(
      "Success! Check your terminal for the tokens. You can close this window."
    );

    // Give time for the message to be shown before closing
    setTimeout(() => {
      process.exit(0);
    }, 1000);
  } catch (error) {
    console.error("Error getting tokens:", error);
    res.send("Error getting tokens. Check your terminal for details.");
  }
});

app.listen(port, () => {
  console.log("Starting authentication process...");
  open(`http://localhost:${port}/login`);
});

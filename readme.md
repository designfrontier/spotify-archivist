# Spotify Playlist Organizer

A Node.js script that organizes your Spotify liked songs into yearly playlists. The script can either create playlists from your liked songs or clear your liked songs library.

## Features

- Creates playlists for your liked songs organized by the year you saved them
- Playlist names follow the format "Liked Songs {YEAR}"
- Process all years, a specific year, or a range of years
- Option to clear all liked songs
- Handles Spotify API rate limits and pagination automatically
- Detailed progress logging
- Error handling per year to prevent complete script failure

## Prerequisites

- Node.js (v14 or higher)
- npm
- Spotify Developer Account
- Spotify API credentials

## Setup

1. Clone this repository or download the script

2. Install dependencies:

```bash
npm install dotenv spotify-web-api-node yargs
```

3. Create a Spotify Developer Application:

   - Go to [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)
   - Create a new application
   - Note down the Client ID and Client Secret
   - Add a redirect URI (e.g., `http://localhost:8888/callback`)

4. Create a `.env` file in the project root with your Spotify credentials:

```
SPOTIFY_CLIENT_ID=your_client_id
SPOTIFY_CLIENT_SECRET=your_client_secret
SPOTIFY_REDIRECT_URI=your_redirect_uri
SPOTIFY_REFRESH_TOKEN=your_refresh_token
```

5. Get your refresh token:
   - Use the [Spotify OAuth Tool](https://developer.spotify.com/documentation/web-api/tutorials/code-flow) to get your initial refresh token
   - Make sure to request these scopes:
     - `user-library-read`
     - `user-library-modify`
     - `playlist-modify-private`

## Usage

### Create Playlists for All Years

To organize all your liked songs into yearly playlists:

```bash
node script.js
```

### Process a Specific Year

To create a playlist for a single year:

```bash
node script.js --year 2023
```

### Process a Range of Years

To process songs from 2020 to 2023:

```bash
node script.js --start-year 2020 --end-year 2023
```

To process all songs from 2020 onwards:

```bash
node script.js --start-year 2020
```

To process all songs up to 2023:

```bash
node script.js --end-year 2023
```

### Clear Liked Songs

To only clear your liked songs without creating playlists:

```bash
node script.js --clear-likes
```

### Help

To see all available options:

```bash
node script.js --help
```

## Progress and Error Handling

The script now provides detailed progress information:

- Number of tracks fetched during initial load
- Summary of tracks per year before processing
- Progress updates during playlist creation
- Per-year error handling (if one year fails, others will still process)

## Notes

- The script handles Spotify's API rate limits automatically
- Playlists are created as private by default
- The script requires a stable internet connection
- Large libraries may take some time to process
- If a year fails to process, the script will continue with the next year

## Troubleshooting

1. If you get authentication errors:

   - Verify your `.env` file contains correct credentials
   - Make sure your refresh token hasn't expired
   - Check that your Spotify Developer Application is active

2. If the script times out:

   - Try processing a smaller range of years using the `--start-year` and `--end-year` options
   - If a specific year fails, try processing just that year using `--year`

3. If you see "Rate limit exceeded" errors:
   - The script handles rate limits automatically but may need to pause
   - For very large libraries, try processing one year at a time

## License

MIT

## Contributing

Feel free to open issues or submit pull requests for any improvements.

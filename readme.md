# Spotify Archivist

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
- openai platform account

## Initial Setup

1. Clone the repo

2. Install dependencies:

```bash
npm install
```

3. Create a Spotify Developer Application:

   - Go to [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)
   - Click "Create App"
   - Fill in the application name and description
   - Set the redirect URI to `http://localhost:8888/callback`
   - Note down the Client ID and Client Secret

4. Create a `.env` file in the project root by changing the name of
   `.env.template` to `.env`

5. Add the values for Client ID and Client Secret to the `.env` file

## Getting Your Spotify Access Tokens

1. Create a file called `get_tokens.js` with the code provided in this repository

2. Run the authentication script:

```bash
node get_tokens.js
```

3. The script will:

   - Open your default browser
   - Redirect to Spotify's login page
   - Ask for permission to access your liked songs and create playlists
   - Display your tokens in the terminal

4. Update your `.env` file with the provided refresh token:

```
SPOTIFY_CLIENT_ID=your_client_id
SPOTIFY_CLIENT_SECRET=your_client_secret
SPOTIFY_REDIRECT_URI=http://localhost:8888/callback
SPOTIFY_REFRESH_TOKEN=your_refresh_token
```

## Add a chatgpt APIi token

Go here https://platform.openai.com/settings/organization/api-keys and create an
API key. Add it to the `.env` file.

This is needed if you want to run analysis as described below. It is used to
categorize and rate the positivity of your songs. See the `.env.template` for
where ths goes.

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

### Analyze Lyrics and Sentiment

To analyze your liked songs:

```bash
node script.js --analyze
```

You can combine this with year options:

```bash
# Analyze a specific year
node script.js --analyze --year 2023

# Analyze a range of years
node script.js --analyze --start-year 2020 --end-year 2023
```

The analysis will:

1. Create an `analysis` directory in your project
2. Generate JSON files for each year (e.g., `analysis_2023.json`)
3. Show sentiment analysis summaries in the console
4. Store detailed analysis in the JSON files

The analysis includes:

- Overall sentiment scores for the year
- Monthly breakdowns of sentiment
- Categorization of sentiment
- Individual song sentiment scores
- Popularity average
- Popularity score by song (spotify's score on a scale of 0-100)

## Progress and Error Handling

The script provides detailed progress information:

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
- The refresh token doesn't expire unless you explicitly revoke access to the application

## Troubleshooting

1. If you get authentication errors:

   - Run `get_tokens.js` again to get a new refresh token
   - Verify your `.env` file contains all required credentials
   - Check that your Spotify Developer Application is active
   - Ensure the redirect URI in your Spotify Developer Dashboard matches exactly: `http://localhost:8888/callback`

2. If you get ES Module errors:

   - Make sure you have `"type": "module"` in your package.json
   - Verify you're using `import` instead of `require` in your code

3. If the script times out:

   - Try processing a smaller range of years using the `--start-year` and `--end-year` options
   - If a specific year fails, try processing just that year using `--year`

4. If you see "Rate limit exceeded" errors:
   - The script handles rate limits automatically but may need to pause
   - For very large libraries, try processing one year at a time

## License

MIT

## Contributing

Feel free to open issues or submit pull requests for any improvements.

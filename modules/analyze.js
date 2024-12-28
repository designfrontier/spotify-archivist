import fs from "fs/promises";
import path from "path";
import OpenAI from "openai";
import {
  groupTracksByYear,
  filterTracksByYearRange,
  groupTracksByMonthAndYear,
} from "./organize.js";
import { getTrack } from "./spotify.js";

const openai = new OpenAI({
  apiKey: process.env["OPENAI_API_KEY"], // This is the default and can be omitted
});

// Define categories and characteristics
const CATEGORIES = {
  Energetic: "High energy, high sentiment, fast tempo (120+)",
  Sad: "Low energy, low sentiment, slow tempo (below 80)",
  Relaxed: "Low energy, high sentiment, slow tempo (below 80)",
  Happy: "High energy, high sentiment, moderate-fast tempo (100-120)",
  Mellow: "Low energy, low sentiment, slow tempo (below 80)",
  Intense: "High energy, low sentiment, fast tempo (110+)",
  Hopeful: "Moderate energy, moderate sentiment, moderate tempo (90-120)",
  Nostalgic: "Low-moderate energy, low sentiment, slow tempo (below 90)",
  Calm: "Low energy, neutral sentiment, slow tempo (below 100)",
  Uplifted:
    "Moderate-high energy, moderate-high sentiment, moderate tempo (100+)",
};

const SCHEMA = {
  type: "object",
  properties: {
    tracks: {
      type: "array",
      items: {
        type: "object",
        properties: {
          title: {
            type: "string",
          },
          artist: {
            type: "string",
          },
          id: {
            type: "string",
          },
          category: {
            type: "string",
            enum: [...Object.keys(CATEGORIES)],
          },
          positivity: {
            type: "number",
          },
        },
        required: ["title", "artist", "id", "category", "positivity"],
        additionalProperties: false,
      },
    },
    sentiment: {
      type: "string",
      enum: [...Object.keys(CATEGORIES)],
    },
    typicalTrack: {
      type: "object",
      properties: {
        title: {
          type: "string",
        },
        artist: {
          type: "string",
        },
        id: {
          type: "string",
        },
        category: {
          type: "string",
          enum: [...Object.keys(CATEGORIES)],
        },
        positivity: {
          type: "number",
        },
      },
      required: ["title", "artist", "id", "category", "positivity"],
      additionalProperties: false,
    },
  },
  required: ["tracks", "sentiment", "typicalTrack"],
  additionalProperties: false,
};

export async function analyzeTracks(songList) {
  /**
   * Categorize a list of songs based on sentiment and energy using OpenAI API.
   *
   * @param {Array} songList - List of songs with "title" and "artist" keys.
   * @return {Promise<Array>} - List of songs with their corresponding categories.
   */

  // Prepare prompt for categorization
  const prompt = `
    Categorize the following songs based on their sentiment and energy. Use the following categories and descriptions:
    ${Object.entries(CATEGORIES)
      .map(([key, desc]) => `- ${key}: ${desc}`)
      .join("\n")}

    Also assign them a numerical positivity score  ranging from extremely positive at 100 points to extremely negative
    at -100 points. This should be based on the tone and lyrical content of the song.

    Songs to categorize:
    ${songList
      .map(
        (song) =>
          `- ${song.title} by ${song.artists.join(", ")} with id: ${song.id}`
      )
      .join("\n")}

    Then categorize the list as a whole into one of the categories above, and choose a song from the list that
    best fits the overall categorization.

    Be concise.
  `;

  try {
    // Make OpenAI API call
    const response = await openai.chat.completions.create({
      model: "gpt-4o-2024-08-06",
      messages: [
        {
          role: "system",
          content: "You are a music sentiment categorization assistant.",
        },
        { role: "user", content: prompt },
      ],
      temperature: 0.3,
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "song_sentiment",
          schema: SCHEMA,
          strict: true,
        },
      },
    });

    // Parse response
    const categories = response.choices[0].message.content;
    return JSON.parse(categories);
  } catch (error) {
    console.error(`Error during API call: ${error.message}`);
    console.error(categories);
    return null;
  }
}

export async function analyze(savedTracks, argv) {
  const tracksByYear = groupTracksByYear(savedTracks);
  const filteredTracks = filterTracksByYearRange(tracksByYear, argv);
  const monthAndYear = groupTracksByMonthAndYear(filteredTracks);

  for (const [year, data] of Object.entries(monthAndYear)) {
    //run the prompts per month and for the year
    for (const [month, tracks] of Object.entries(data)) {
      data[month].analysis = await analyzeTracks(tracks.tracks);
      data[month].analysis.mostPopular = { popularity: 0 };
      data[month].analysis.leastPopular = { popularity: 100 };
      data[month].analysis.popularity = 0;
      data[month].analysis.positivity = 0;
      data[month].tracks = await Promise.all(
        data[month].tracks.map(async (t) => {
          const details = await getTrack(t.id);
          const analysis = data[month].analysis.tracks.filter(
            (track) => track.id === t.id
          );

          return {
            ...t,
            ...details.body,
            positivity: analysis[0].positivity,
            category: analysis[0].category,
          };
        })
      );

      data[month].tracks.reduce((a, t) => {
        if (t.popularity > a.mostPopular.popularity) {
          a.mostPopular = t;
        }

        if (t.popularity < a.leastPopular.popularity) {
          a.leastPopular = t;
        }

        a.popularity += t.popularity;

        return a;
      }, data[month].analysis);

      data[month].tracks.reduce((a, t) => {
        a.positivity += t.positivity;

        return a;
      }, data[month].analysis);

      data[month].analysis.popularity =
        data[month].analysis.popularity / data[month].tracks.length;
    }
  }

  for (const [year, yearData] of Object.entries(monthAndYear)) {
    console.log(`\nProcessing ${year}...`);

    // Save the data
    const outputDir = "./analysis";
    await fs.mkdir(outputDir, { recursive: true });
    await fs.writeFile(
      path.join(outputDir, `analysis_${year}.json`),
      JSON.stringify(yearData, null, 2)
    );

    // Print summary
    console.log(`\nAnalysis Summary for ${year}:`);
    console.log("Overall:");
    outputMonth(yearData.all);

    console.log("\nMonthly Breakdown:");
    Object.entries(yearData)
      .filter(([k]) => k !== "all")
      .sort(([a], [b]) => sortByMonth(a, b))
      .forEach(([month, data]) => {
        console.log(`${month}`);
        outputMonth(data);
      });
  }
}

function sortByMonth(a, b) {
  const monthOrder = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  return monthOrder.indexOf(a) - monthOrder.indexOf(b);
}

function outputMonth(monthData) {
  console.log(`- Number of liked songs: ${monthData.tracks.length}`);
  console.log(
    `- Average positivity score: ${(
      monthData.analysis.positivity / monthData.tracks.length
    ).toFixed(2)}`
  );
  console.log(
    `- Average popularity score: ${monthData.analysis.popularity.toFixed(2)}`
  );
  console.log(
    `- Most popular song: ${
      monthData.analysis.mostPopular.name
    } - ${monthData.analysis.mostPopular.artists
      .map((a) => a.name)
      .join(", ")} (${monthData.analysis.mostPopular.popularity}/100)`
  );
  console.log(
    `- Least popular song: ${
      monthData.analysis.leastPopular.name
    } - ${monthData.analysis.leastPopular.artists
      .map((a) => a.name)
      .join(", ")} (${monthData.analysis.leastPopular.popularity}/100)`
  );
}

export function groupTracksByYear(savedTracks) {
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
      title: item.track.name,
      artists: item.track.artists.map((artist) => artist.name),
      date_liked: item.added_at,
    });
  });
  return tracksByYear;
}

export function groupTracksByMonthAndYear(tracksByYear) {
  return Object.keys(tracksByYear).reduce((acc, year) => {
    acc[year] = { all: { tracks: tracksByYear[year] } };

    tracksByYear[year].reduce((a, track) => {
      const month = getMonthKey(new Date(track.date_liked));

      if (!a[month]) {
        a[month] = { tracks: [] };
      }

      a[month].tracks.push(track);

      return a;
    }, acc[year]);

    return acc;
  }, {});
}

export function filterTracksByYearRange(tracksByYear, argv) {
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

export function getMonthKey(date) {
  const monthNames = [
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
  return monthNames[date.getMonth()];
}

import { SpotifyApi } from "@spotify/web-api-ts-sdk"

export async function updateCsvWithSpotifyLinks(
  csvText: string,
  spotifySdk: SpotifyApi,
): Promise<string> {
  const lines = csvText.split(/\r?\n/).filter(Boolean)
  const header = "Card#,Title,Artist,Year,SpotifyURL"
  const resultRows = [header]
  console.log("Processing CSV to update Spotify links...")
  console.log(`Total rows to process: ${lines.length - 1}`)
  console.log(lines)
  for (let i = 1; i < lines.length; i++) {
    const row = lines[i]
    // Split CSV row, handling quoted commas
    const cols = row.match(/(?:"[^"]*"|[^,])+/g)?.map((s) => s.replace(/^"|"$/g, ""))
    if (!cols || cols.length < 4) continue
    const [cardId, title, artist, year] = [cols[0], cols[1], cols[2], cols[3]]
    let spotifyUrl = ""
    try {
      const searchQuery = `${title} ${artist}`
      const searchResult = await spotifySdk.search(searchQuery, ["track"])
      const track =
        searchResult.tracks?.items?.find(
          (t) =>
            t.name.toLowerCase() === title.toLowerCase() &&
            t.artists.some((a) => a.name.toLowerCase() === artist.toLowerCase()),
        ) || searchResult.tracks?.items?.[0]
      if (track) {
        spotifyUrl = `https://open.spotify.com/track/${track.id}`
      }
    } catch (e) {
      spotifyUrl = ""
    }
    resultRows.push([cardId, title, artist, year, spotifyUrl].join(","))
  }
  console.log(`Processed ${resultRows.length - 1} rows with Spotify links.`)
  return resultRows.join("\n")
}

import type { SpotifyApi } from "@spotify/web-api-ts-sdk"

// Variable to specify the file name
const csvFileName = "/hitster/hitster-de-aaaa0007.csv"

// Handler to process CSV
export async function handleProcessCsv(spotifySdk: SpotifyApi | null): Promise<void> {
  if (!spotifySdk) {
    alert("Spotify SDK not initialized.")
    return
  }
  try {
    // Fetch the CSV file
    const response = await fetch(csvFileName)
    const csvText = await response.text()
    // Process the CSV
    const convertedCsv = await updateCsvWithSpotifyLinks(csvText, spotifySdk)
    // Save the new CSV file (download in browser)
    const blob = new Blob([convertedCsv], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `converted-${csvFileName.split("/").pop()}`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  } catch (err) {
    alert(`Failed to process CSV: ${err instanceof Error ? err.message : err}`)
  }
}

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
    const [cardId, title, artist, year] = [cols[0], cols[1], cols[2], cols[6]]
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

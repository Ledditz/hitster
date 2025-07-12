import { toast } from "sonner"

export function parseHitsterUrl(url: string): { lang: string; id: string } | null {
  const regex = /^(?:http:\/\/|https:\/\/)?www\.hitstergame\.com\/(.+?)\/(\d+)$/
  const match = url.match(regex)
  if (match) {
    // Hitster URL is in the format: https://www.hitstergame.com/{lang}/{id}
    // lang can be things like "en", "de", "pt", etc., but also "de/aaaa0007"
    const processedLang = match[1].replace(/\//g, "-")
    return { lang: processedLang, id: match[2] }
  }
  const regex_nordics =
    /^(?:http:\/\/|https:\/\/)?app.hitster(nordics).com\/resources\/songs\/(\d+)$/
  const match_nordics = url.match(regex_nordics)
  if (match_nordics) {
    // Hitster URL can also be in the format: https://app.hitsternordics.com/resources/songs/{id}
    return { lang: match_nordics[1], id: match_nordics[2] }
  }
  return null
}

export function isHitsterLink(url: string): boolean {
  // Regular expression to match with or without "http://" or "https://"
  const regex = /^(?:http:\/\/|https:\/\/)?(www\.hitstergame|app\.hitsternordics)\.com\/.+/
  return regex.test(url)
}

export async function getSongFromHitsterUrl(url: string) {
  if (!url) return null
  if (!isHitsterLink(url)) return null
  const parsed = parseHitsterUrl(url)
  if (!parsed) {
    toast.error("Invalid Hitster QR link.")
    return
  }
  // Remove leading zeros from id for CSV match
  const parsedId = parsed.id.replace(/^0+/, "")
  const csvUrl = `/hitster/hitster-${parsed.lang}.csv`
  // const csvUrl = "/hitster/hitster-de-aaaa0015.csv"

  try {
    const response = await fetch(csvUrl)
    if (!response.ok) {
      toast.error(`No CSV found under: ${csvUrl}`)
      return
    }
    const csvText = await response.text()
    // Find the row with the correct id
    const lines = csvText.split(/\r?\n/).filter(Boolean)
    let found = null
    for (let i = 1; i < lines.length; i++) {
      const cols = lines[i].match(/(:?"[^"]*"|[^,])+/g)?.map((s) => s.replace(/^"|"$/g, ""))
      if (!cols || cols.length < 5) continue
      if (cols[0] === parsedId) {
        found = cols
        break
      }
    }
    if (!found) {
      toast.error("Song not found in CSV.")
      return
    }
    const [id, name, artist, year, spotifyUrl] = found
    if (!spotifyUrl || !spotifyUrl.startsWith("https://open.spotify.com/track/")) {
      toast.error("No Spotify link found for this song.")
      return
    }
    const trackId = spotifyUrl.split("/track/")[1].split("?")[0]
    const trackUri = `spotify:track:${trackId}`
    return {
      id,
      spotifyLink: trackUri,
      title: name,
      artist,
      year,
    }
  } catch (err) {
    const errorMessage =
      err && typeof err === "object" && "message" in err
        ? (err as { message: string }).message
        : String(err)
    toast.error(`Failed to get song: ${errorMessage}`)
  }
  return null
}

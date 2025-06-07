export     function parseHitsterUrl(url:string): { lang: string; id: string } | null {
        const regex = /^(?:http:\/\/|https:\/\/)?www\.hitstergame\.com\/(.+?)\/(\d+)$/;
        const match = url.match(regex);
        if (match) {
            // Hitster URL is in the format: https://www.hitstergame.com/{lang}/{id}
            // lang can be things like "en", "de", "pt", etc., but also "de/aaaa0007"
            const processedLang = match[1].replace(/\//g, "-");
            return { lang: processedLang, id: match[2] };
        }
        const regex_nordics = /^(?:http:\/\/|https:\/\/)?app.hitster(nordics).com\/resources\/songs\/(\d+)$/;
        const match_nordics = url.match(regex_nordics);
        if (match_nordics) {
            // Hitster URL can also be in the format: https://app.hitsternordics.com/resources/songs/{id}
            return { lang: match_nordics[1], id: match_nordics[2] };
        }
        return null;
    }

export     function isHitsterLink(url:string): boolean {
        // Regular expression to match with or without "http://" or "https://"
        const regex = /^(?:http:\/\/|https:\/\/)?(www\.hitstergame|app\.hitsternordics)\.com\/.+/;
        return regex.test(url);
    }

export async function playHitsterSongFromQr({
  qrResult,
  spotifySdk,
  selectedDeviceId,
  setPlaying,
  setPlayError,
  logOut
}: {
  qrResult: string | null,
  spotifySdk: any,
  selectedDeviceId: string | null,
  setPlaying: (v: boolean) => void,
  setPlayError: (v: string | null) => void,
  logOut:()=>void
}) {
  setPlayError(null);
  if (!qrResult) return;
  if (!isHitsterLink(qrResult)) return;
  const parsed = parseHitsterUrl(qrResult);
  if (!parsed) {
    setPlayError('Invalid Hitster QR link.');
    return;
  }
  // Remove leading zeros from id for CSV match
  const parsedId = parsed.id.replace(/^0+/, '');
  // Only support German deck for now
  const csvUrl = '/hitster/hitster-de-aaaa0015.csv';
  try {
    const response = await fetch(csvUrl);
    const csvText = await response.text();
    // Find the row with the correct id
    const lines = csvText.split(/\r?\n/).filter(Boolean);
    let found = null;
    for (let i = 1; i < lines.length; i++) {
      const cols = lines[i].match(/(?:"[^"]*"|[^,])+/g)?.map(s => s.replace(/^"|"$/g, ''));
      if (!cols || cols.length < 5) continue;
      if (cols[0] === parsedId) {
        found = cols;
        break;
      }
    }
    if (!found) {
      setPlayError('Song not found in CSV.');
      return;
    }
    const spotifyUrl = found[4];
    if (!spotifyUrl || !spotifyUrl.startsWith('https://open.spotify.com/track/')) {
      setPlayError('No Spotify link found for this song.');
      return;
    }
    const trackId = spotifyUrl.split('/track/')[1].split('?')[0];
    const trackUri = `spotify:track:${trackId}`;
    if (!spotifySdk) {
      setPlayError('Spotify SDK not available. Please login.');
      logOut()
      return;
    }
    if (!selectedDeviceId) {
      setPlayError('No Spotify device selected.');
      return;
    }
    setPlaying(true);
    // Play the song using Spotify API
    await fetch(`https://api.spotify.com/v1/me/player/play?device_id=${selectedDeviceId}`,
      {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('spotify_access_token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          uris: [trackUri],
          position_ms: 30000
        })
      }
    );
    setTimeout(async () => {
      try {
        await spotifySdk.player.pausePlayback(selectedDeviceId);
      } catch (e) {}
      setPlaying(false);
    }, 10000);
  } catch (err: any) {
    setPlayError('Failed to play song: ' + (err?.message || err));
    setPlaying(false);
  }
}
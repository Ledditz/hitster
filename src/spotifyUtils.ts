// src/spotifyUtils.ts

/**
 * Checks if the current Spotify access token is valid by calling the /v1/me endpoint.
 * Calls onUnauthorized if the token is invalid or request fails.
 * @param accessToken The Spotify access token
 * @param onUnauthorized Callback to call if unauthorized
 */
export async function checkSpotifyAuth(accessToken: string | undefined, onUnauthorized: () => void) {
  if (!accessToken) return;
  try {
    const res = await fetch('https://api.spotify.com/v1/me', {
      headers: {
        Authorization: `Bearer ${accessToken}`
      }
    });
    if (res.status === 401) {
      onUnauthorized();
    }
  } catch (e) {
    onUnauthorized();
  }
}

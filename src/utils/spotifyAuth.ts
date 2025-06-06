// Handles Spotify authentication and token management
import type { SpotifyApi } from "@spotify/web-api-ts-sdk"
import pkceChallenge from "pkce-challenge"
import { toast } from "sonner"

export const SPOTIFY_CLIENT_ID = import.meta.env.VITE_SPOTIFY_CLIENT_ID
export const SPOTIFY_REDIRECT_URI = import.meta.env.VITE_REDIRECT_URI
export const SPOTIFY_SCOPES =
  "user-read-private user-read-email user-modify-playback-state user-read-playback-state streaming"

export async function handleSpotifyRedirect(
  setIsLoggedIn: (v: boolean) => void,
  codeFromApp?: string,
) {
  const urlParams = new URLSearchParams(window.location.search)
  const code = codeFromApp ?? urlParams.get("code")
  if (code) {
    const storedVerifier = localStorage.getItem("spotify_code_verifier")
    if (!storedVerifier) {
      toast.error(
        "Spotify login failed: Missing code verifier. Please try again and do not close or refresh the tab during login.",
      )
      return
    }
    if (storedVerifier) {
      try {
        const res = await fetch("https://accounts.spotify.com/api/token", {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: new URLSearchParams({
            client_id: SPOTIFY_CLIENT_ID,
            grant_type: "authorization_code",
            code,
            redirect_uri: SPOTIFY_REDIRECT_URI,
            code_verifier: storedVerifier,
          }),
        })
        localStorage.removeItem("spotify_code_verifier") // Always clear after use
        let data: Record<string, unknown>
        if (!res.ok) {
          // Try to parse error as JSON, fallback to text
          try {
            data = await res.json()
          } catch {
            const errorText = await res.text()
            data = { error: "unknown_error", error_description: errorText }
          }
          setIsLoggedIn(false)
          localStorage.removeItem("spotify_access_token")
          localStorage.removeItem("spotify_refresh_token")
          localStorage.removeItem("spotify_expires_at")
          toast.error(
            `Failed to log in to Spotify. Please try again. ${data.error_description || data.error || ""}`,
          )
          window.history.replaceState({}, document.title, "/")
          return
        }
        data = await res.json()
        if (data.error || !data.access_token) {
          setIsLoggedIn(false)
          localStorage.removeItem("spotify_access_token")
          localStorage.removeItem("spotify_refresh_token")
          localStorage.removeItem("spotify_expires_at")
          toast.error(
            `Failed to log in to Spotify. Please try again. ${data.error_description || data.error || ""}`,
          )
          window.history.replaceState({}, document.title, "/")
          return
        }
        // Only success path below
        setIsLoggedIn(true)
        toast.success("Successfully logged in to Spotify!")
        localStorage.setItem("spotify_access_token", String(data.access_token))
        if (data.refresh_token)
          localStorage.setItem("spotify_refresh_token", String(data.refresh_token))
        if (data.expires_in) {
          const expiresAt = Date.now() + Number(data.expires_in) * 1000
          localStorage.setItem("spotify_expires_at", expiresAt.toString())
        }
        window.history.replaceState({}, document.title, "/")
        return // Prevent error toast after successful login
      } catch (err) {
        localStorage.removeItem("spotify_code_verifier")
        setIsLoggedIn(false)
        localStorage.removeItem("spotify_access_token")
        localStorage.removeItem("spotify_refresh_token")
        localStorage.removeItem("spotify_expires_at")
        let message = "An unknown error occurred during Spotify login."
        if (err instanceof Error) message = err.message
        toast.error(`Failed to log in to Spotify. ${message}`)
        window.history.replaceState({}, document.title, "/")
      }
    }
  } else {
    const token = localStorage.getItem("spotify_access_token")
    if (token) setIsLoggedIn(true)
  }
}

export async function getValidSpotifyToken(
  setIsLoggedIn: (v: boolean) => void,
  setSpotifySdk: (v: SpotifyApi | null) => void,
) {
  const accessToken = localStorage.getItem("spotify_access_token")
  const expiresAt = localStorage.getItem("spotify_expires_at")
  const refreshToken = localStorage.getItem("spotify_refresh_token")
  if (!accessToken || !expiresAt || !refreshToken) return null
  if (Date.now() < Number.parseInt(expiresAt)) return accessToken
  const params = new URLSearchParams({
    grant_type: "refresh_token",
    refresh_token: refreshToken,
    client_id: SPOTIFY_CLIENT_ID,
  })
  const response = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: params.toString(),
  })
  const data = await response.json()
  if (data.access_token) {
    localStorage.setItem("spotify_access_token", data.access_token)
    if (data.expires_in) {
      const expiresAt = Date.now() + data.expires_in * 1000
      localStorage.setItem("spotify_expires_at", expiresAt.toString())
    }
    return data.access_token
  }
  setIsLoggedIn(false)
  setSpotifySdk(null)
  localStorage.removeItem("spotify_access_token")
  localStorage.removeItem("spotify_refresh_token")
  localStorage.removeItem("spotify_expires_at")
  return null
}

export async function handleSpotifyLogin() {
  if (
    !window.crypto ||
    !window.crypto.subtle ||
    typeof window.crypto.subtle.digest !== "function"
  ) {
    toast.error(
      "Your browser does not support the required cryptography features for Spotify login (PKCE S256). Please open this app in a modern browser.",
    )
    return
  }
  const pkce = await pkceChallenge()
  const code_verifier = pkce.code_verifier
  const code_challenge = pkce.code_challenge
  localStorage.setItem("spotify_code_verifier", code_verifier)
  const authUrl = `https://accounts.spotify.com/authorize?client_id=${SPOTIFY_CLIENT_ID}&response_type=code&redirect_uri=${encodeURIComponent(SPOTIFY_REDIRECT_URI)}&scope=${encodeURIComponent(SPOTIFY_SCOPES)}&code_challenge_method=S256&code_challenge=${code_challenge}`
  window.location.href = authUrl
}

export function logOut(
  setIsLoggedIn: (v: boolean) => void,
  setSpotifySdk: (v: SpotifyApi | null) => void,
) {
  setIsLoggedIn(false)
  setSpotifySdk(null)
  localStorage.removeItem("spotify_access_token")
  localStorage.removeItem("spotify_refresh_token")
  localStorage.removeItem("spotify_expires_at")
}

import { useState, useEffect } from "react"
import "./App.css"
import { SpotifyApi } from "@spotify/web-api-ts-sdk"
import {
  handleSpotifyRedirect,
  getValidSpotifyToken,
  handleSpotifyLogin,
  logOut,
  SPOTIFY_CLIENT_ID,
} from "./utils/spotifyAuth"
import { AnimatedLogo } from "./components/AnimatedLogo"
import { QrMode } from "./qr-mode/QrMode"
import { PlaylistMode } from "./playlist-mode/PlaylistMode"
import { SpotifyProvider, useSpotifyContext } from "./contexts/SongContext"
import { GlobalToaster } from "./components/GlobalToaster"
import { Header } from "./components/Header"

function AppContent() {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [mode, setMode] = useState<"qr" | "playlist" | null>(null)
  const { setSpotifySdk } = useSpotifyContext()

  // Handle Spotify OAuth redirect
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const code = urlParams.get("code")
    if (code) {
      window.history.replaceState({}, document.title, "/")
      handleSpotifyRedirect(setIsLoggedIn, code)
    }
  }, [])

  // biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
  useEffect(() => {
    ;(async () => {
      const token = await getValidSpotifyToken(setIsLoggedIn, setSpotifySdk)
      if (token) {
        setSpotifySdk(
          SpotifyApi.withAccessToken(SPOTIFY_CLIENT_ID, {
            access_token: token,
            token_type: "Bearer",
            expires_in: 3600,
            expires: 0, // dummy value, not used
            refresh_token: "", // not used for implicit flow
          }),
        )
        setIsLoggedIn(true)
      }
    })()
  }, [isLoggedIn, setSpotifySdk])

  return (
    <div className="min-h-screen bg-gray-900 text-white pt-20 sm:pt-20 px-2 sm:px-4 flex flex-col items-stretch w-full">
      <div className="flex flex-col items-center w-full">
        <AnimatedLogo />
      </div>
      <p className="text-2xl sm:text-4xl font-extrabold tracking-tight drop-shadow-lg mt-4 text-center">
        Songster
      </p>
      <div className="flex flex-col items-center w-full max-w-md mx-auto">
        <span className="text-base sm:text-lg text-gray-300 mb-1 text-center block">
          Your playlist, your game
        </span>
        <div className="w-24 border-t border-gray-500 my-1 mx-auto" />
      </div>
      {!isLoggedIn ? (
        <div className="flex flex-col items-center w-full mt-5">
          <button
            type="button"
            onClick={handleSpotifyLogin}
            className="px-4 py-2 rounded bg-green-400 hover:bg-green-500 text-white font-bold shadow-lg border-2 border-white focus:outline-none focus:ring-2 focus:ring-green-300 transition rounded-4xl w-50"
          >
            Login with Spotify
          </button>
        </div>
      ) : (
        <>
          {/* Add CSV process button for testing */}
          {/* <button onClick={handleProcessCsv} className="mb-4 px-4 py-2 rounded bg-yellow-500 hover:bg-yellow-600 text-white font-semibold shadow transition">Process CSV & Log</button> */}
          {/* {showSuccess && (
            <div className="text-green-400 mb-4 font-medium text-center">
              Successfully logged in to Spotify!
            </div>
          )} */}
          {mode === null && (
            <div className="flex flex-col gap-4 mb-4 w-full max-w-xs mx-auto mt-4 items-center justify-center">
              <button
                type="button"
                onClick={() => setMode("qr")}
                className="px-4 py-2 rounded bg-blue-500 hover:bg-blue-600 text-white font-bold shadow-lg border-2 border-white focus:outline-none focus:ring-2 focus:ring-blue-300 transition rounded-4xl w-50"
              >
                QR/Hitster-Mode{" "}
              </button>
              <button
                type="button"
                onClick={() => setMode("playlist")}
                className="px-4 py-2 rounded bg-emerald-500 hover:bg-emerald-600 text-white font-bold shadow-lg border-2 border-white focus:outline-none focus:ring-2 focus:ring-emerald-300 transition rounded-4xl w-50"
              >
                Playlist-Mode
              </button>
              {/* Logout button */}
              <button
                type="button"
                onClick={() => logOut(setIsLoggedIn, setSpotifySdk)}
                className="px-4 py-2 rounded bg-red-500 hover:bg-red-600 text-white font-bold shadow-lg border-2 border-white focus:outline-none focus:ring-2 focus:ring-red-300 transition rounded-4xl w-50"
              >
                Logout
              </button>
            </div>
          )}
          {mode === "qr" && <QrMode logOut={() => logOut(setIsLoggedIn, setSpotifySdk)} />}
          {mode === "playlist" && (
            <PlaylistMode logOut={() => logOut(setIsLoggedIn, setSpotifySdk)} />
          )}

          {mode !== null && <Header mode={mode} onBack={() => setMode(null)} />}
        </>
      )}
    </div>
  )
}

function App() {
  return (
    <SpotifyProvider>
      <GlobalToaster />
      <AppContent />
    </SpotifyProvider>
  )
}

export default App

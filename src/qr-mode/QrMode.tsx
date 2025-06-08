import React, { useEffect, useState } from "react"
import { useQrScanner } from "./qrScanner"
import { playHitsterSongFromQr } from "./hitsterUtils"
import { useSpotifyContext } from "../contexts/SongContext"
import { MdQrCode, MdClose } from "react-icons/md"
import { PlayButtons } from "../components/PlayButtons"
import { checkSpotifyAuth } from "../utils/spotifyUtils"
import CollapsibleSongInfo from "../components/CollapsibleSongInfo"

interface QrModeProps {
  logOut: () => void
}

export const QrMode: React.FC<QrModeProps> = ({ logOut }) => {
  const { scanning, qrResult, barcodeError, startQrScanner, cancelQrScanner } = useQrScanner()
  const { spotifySdk, setPlaying, setSongAndPlaying, song, currentDeviceId, pauseCurrentPlay } =
    useSpotifyContext()
  const [playError, setPlayError] = useState<string | null>(null)
  // Add replayEnabled state for replay button
  const [replayEnabled, setReplayEnabled] = useState(false)
  // Timeout ref for playback pause
  const playTimeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null)

  // biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
  useEffect(() => {
    const handlePlay = async () => {
      // Clear any previous timeout
      if (playTimeoutRef.current) {
        clearTimeout(playTimeoutRef.current)
        playTimeoutRef.current = null
      }
      const result = await playHitsterSongFromQr({
        qrResult,
        spotifySdk,
        selectedDeviceId: currentDeviceId,
        setPlayError,
        logOut,
        setSongAndPlaying,
      })
      if (result?.trackUri) {
        setReplayEnabled(true)
        if (result.timeOut) playTimeoutRef.current = result.timeOut
      }
    }
    handlePlay()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [qrResult])

  // Clear timeout on unmount
  useEffect(() => {
    return () => {
      if (playTimeoutRef.current) {
        clearTimeout(playTimeoutRef.current)
        playTimeoutRef.current = null
      }
    }
  }, [])

  // Check Spotify auth when spotifySdk changes
  useEffect(() => {
    if (!spotifySdk) return
    const checkAuth = async () => {
      const accessToken = await spotifySdk.getAccessToken()
      checkSpotifyAuth(accessToken, logOut)
    }
    checkAuth()
  }, [spotifySdk, logOut])

  // Handler for replaying the last played song using SongContext
  const handleReplaySong = async () => {
    if (!spotifySdk || !song) return
    // Clear any previous timeout
    if (playTimeoutRef.current) {
      clearTimeout(playTimeoutRef.current)
      playTimeoutRef.current = null
    }
    try {
      await fetch(`https://api.spotify.com/v1/me/player/play?device_id=${currentDeviceId}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("spotify_access_token")}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          uris: [song.spotifyLink.replace("https://open.spotify.com/track/", "spotify:track:")],
          position_ms: 30000,
        }),
      })
      setPlaying(true)
      playTimeoutRef.current = setTimeout(async () => {
        playTimeoutRef.current = null
        if (pauseCurrentPlay) {
          await pauseCurrentPlay()
        }
      }, 10000)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err)
      setPlayError(`Failed to replay song: ${errorMessage}`)
      if (pauseCurrentPlay) {
        await pauseCurrentPlay()
      }
    }
  }

  return (
    <div className="flex flex-col items-center mt-8">
      {!scanning && (
        <button
          type="button"
          onClick={startQrScanner}
          className="px-4 py-2 rounded-4xl bg-blue-500 hover:bg-blue-600 disabled:bg-gray-500 text-white font-semibold shadow transition mb-2 flex items-center gap-2"
        >
          {/* QR code icon */}
          <MdQrCode className="w-5 h-5" />
          Scan
        </button>
      )}
      {scanning && (
        <button
          type="button"
          onClick={cancelQrScanner}
          className="ml-2 px-4 py-2 rounded-4xl bg-red-500 hover:bg-red-600 text-white font-semibold shadow transition mb-2 flex items-center justify-center"
        >
          {/* X icon */}
          <MdClose className="w-5 h-5" />
        </button>
      )}
      {/* Always render the video container, but only show it when scanning */}
      <div
        id="qr-video-container"
        className={`my-4 aspect-square w-64 max-w-full ${scanning ? "" : "invisible"}`}
        style={{ height: scanning ? "auto" : "0px" }}
      />
      {barcodeError && <div className="text-red-400 mb-2">{barcodeError}</div>}
      {playError && <div className="text-red-400 mb-2">{playError}</div>}
      <PlayButtons replayEnabled={replayEnabled} replaySong={handleReplaySong} />
      {/* Collapsible Last Played Song Info */}
      <CollapsibleSongInfo />
    </div>
  )
}

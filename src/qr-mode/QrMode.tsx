import React, { useEffect, useState } from "react"
import { useQrScanner } from "./qrScanner"
import { playHitsterSongFromQr } from "./hitsterUtils"
import { useSpotifyContext } from "../contexts/SongContext"
import { MdQrCode, MdClose } from "react-icons/md"
import { PlayButtons } from "../components/PlayButtons"
import CollapsibleSongInfo from "../components/CollapsibleSongInfo"

interface QrModeProps {
  playbackMode: "beginning" | "custom" | "random"
  customStartTime: number
}

export const QrMode: React.FC<QrModeProps> = ({ playbackMode, customStartTime }) => {
  const { scanning, qrResult, barcodeError, startQrScanner, cancelQrScanner } = useQrScanner()
  const { playTrack, setPlaying, setSongAndPlaying, song, pauseCurrentPlay } = useSpotifyContext()
  const [playError, setPlayError] = useState<string | null>(null)
  const [replayEnabled, setReplayEnabled] = useState(false)
  const playTimeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null)

  // Helper to get start time based on mode
  const getStartTime = React.useCallback(() => {
    if (playbackMode === "beginning") return 0
    if (playbackMode === "custom") return customStartTime * 1000
    return Math.floor(Math.random() * 90_000)
  }, [playbackMode, customStartTime])

  useEffect(() => {
    const handlePlay = async () => {
      if (playTimeoutRef.current) {
        clearTimeout(playTimeoutRef.current)
        playTimeoutRef.current = null
      }
      const result = await playHitsterSongFromQr({
        qrResult,
        playTrack: (trackUri, position_ms) => playTrack(trackUri, position_ms ?? 30000),
        setPlayError,
        setSongAndPlaying,
        position_ms: getStartTime(),
      })
      if (result?.trackUri) {
        setReplayEnabled(true)
      }
    }
    handlePlay()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [qrResult, playTrack, setSongAndPlaying, getStartTime])

  // Handler for replaying the last played song using SongContext
  const handleReplaySong = async () => {
    if (!song) return
    if (playTimeoutRef.current) {
      clearTimeout(playTimeoutRef.current)
      playTimeoutRef.current = null
    }
    try {
      await playTrack(
        song.spotifyLink.replace("https://open.spotify.com/track/", "spotify:track:"),
        getStartTime(),
      )
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
      {/* Playback Settings moved to SettingsDialog */}
      {/* Remove playback settings UI from here */}
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

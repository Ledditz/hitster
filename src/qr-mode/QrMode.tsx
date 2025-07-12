import React, { useEffect, useState } from "react"
import { useQrScanner } from "./utils/useQrScanner"
import { getSongFromHitsterUrl } from "./utils/hitsterUtils"
import { useSpotifyContext } from "../contexts/SongContext"
import { PlayButtons } from "../components/PlayButtons"
import CollapsibleSongInfo from "../components/CollapsibleSongInfo"
import { toast } from "sonner"
import { Scanner } from "./Scanner"

interface QrModeProps {
  playbackMode: "beginning" | "custom" | "random"
  customStartTime: number
}

export const QrMode: React.FC<QrModeProps> = ({ playbackMode, customStartTime }) => {
  const { scanning, qrResult, startQrScanner, cancelQrScanner } = useQrScanner()
  const { playTrack, setSongAndPlaying, song, pauseCurrentPlay } = useSpotifyContext()
  const [replayEnabled, setReplayEnabled] = useState(false)

  // Helper to get start time based on mode
  const getStartTime = React.useCallback(() => {
    if (playbackMode === "beginning") return 0
    if (playbackMode === "custom") return customStartTime * 1000
    return Math.floor(Math.random() * 90_000)
  }, [playbackMode, customStartTime])

  // biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
  useEffect(() => {
    const handlePlay = async () => {
      if (!qrResult) return

      const scannedSong = await getSongFromHitsterUrl(qrResult)
      if (!scannedSong) {
        toast.error("Invalid Hitster QR code.")
        return
      }
      try {
        await playTrack(scannedSong.spotifyLink, getStartTime())
        setSongAndPlaying(scannedSong, true)
        setReplayEnabled(true)
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : String(err)
        toast.error(`Failed to play song: ${errorMessage}`)
        pauseCurrentPlay?.()
      }
    }
    handlePlay()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [qrResult])

  // Handler for replaying the last played song using SongContext
  const handleReplaySong = async () => {
    if (!song) return
    try {
      await playTrack(song.spotifyLink, getStartTime())
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err)
      toast.error(`Failed to replay song: ${errorMessage}`)
      if (pauseCurrentPlay) {
        await pauseCurrentPlay()
      }
    }
  }

  return (
    <div className="flex flex-col items-center mt-8">
      {/* Playback Settings moved to SettingsDialog */}
      {/* Remove playback settings UI from here */}
      <Scanner startScan={startQrScanner} cancleScan={cancelQrScanner} isScanning={scanning} />
      {!scanning && (
        <>
          <PlayButtons
            replayEnabled={replayEnabled}
            replaySong={handleReplaySong}
            pauseSong={pauseCurrentPlay}
          />
          {/* Collapsible Last Played Song Info */}
          <CollapsibleSongInfo />
        </>
      )}
    </div>
  )
}

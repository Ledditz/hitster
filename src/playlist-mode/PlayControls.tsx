import React from "react"
import { useSpotifyContext } from "../contexts/SongContext"
import { PlayButtons } from "../components/PlayButtons"

export const PlayControls: React.FC<{
  playbackMode: "beginning" | "custom" | "random"
  customStartTime: number
}> = ({ playbackMode, customStartTime }) => {
  const { playRandomSong, playTrack, setPlaying, song, pauseCurrentPlay } = useSpotifyContext()
  const [replayEnabled, setReplayEnabled] = React.useState(false)
  const playTimeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null)
  // Store the last used start time for replay
  const [lastStartTime, setLastStartTime] = React.useState<number>(0)

  // Helper to get start time based on mode
  const getStartTime = () => {
    if (playbackMode === "beginning") return 0
    if (playbackMode === "custom") return Math.min(customStartTime, 120) * 1000
    // random between 0 and 90 seconds
    return Math.floor(Math.random() * 90_000)
  }

  // Pause playback on the active device
  const handlePause = async () => {
    if (playTimeoutRef.current) {
      clearTimeout(playTimeoutRef.current)
      playTimeoutRef.current = null
    }
    if (pauseCurrentPlay) {
      await pauseCurrentPlay()
    }
  }

  // Play random song from selected playlist
  const handlePlayRandomSong = async () => {
    setReplayEnabled(false)
    let startTime = 0
    if (playbackMode === "random") {
      startTime = getStartTime()
      setLastStartTime(startTime)
    } else if (playbackMode === "custom") {
      startTime = Math.min(customStartTime, 120) * 1000
      setLastStartTime(startTime)
    } else {
      startTime = 0
      setLastStartTime(0)
    }
    // @ts-ignore: playRandomSong now accepts position_ms
    await playRandomSong(startTime)
    setReplayEnabled(true)
    if (playTimeoutRef.current) {
      clearTimeout(playTimeoutRef.current)
    }
    playTimeoutRef.current = setTimeout(async () => {
      playTimeoutRef.current = null
      if (pauseCurrentPlay) {
        await pauseCurrentPlay()
      }
    }, 10000)
  }

  // Replay last played song
  const handleReplaySong = async () => {
    if (!song) return
    setPlaying(true)
    // Use lastStartTime for replay if random, else use current mode
    const startTime =
      playbackMode === "random"
        ? lastStartTime
        : playbackMode === "custom"
          ? Math.min(customStartTime, 120) * 1000
          : 0
    // @ts-ignore: playTrack now accepts position_ms
    await playTrack(song.spotifyLink, startTime)
    if (playTimeoutRef.current) {
      clearTimeout(playTimeoutRef.current)
    }
    playTimeoutRef.current = setTimeout(async () => {
      playTimeoutRef.current = null
      if (pauseCurrentPlay) {
        await pauseCurrentPlay()
      }
    }, 10000)
  }

  React.useEffect(() => {
    return () => {
      if (playTimeoutRef.current) {
        clearTimeout(playTimeoutRef.current)
        playTimeoutRef.current = null
      }
    }
  }, [])

  return (
    <>
      <PlayButtons
        replayEnabled={replayEnabled}
        playSong={handlePlayRandomSong}
        replaySong={handleReplaySong}
        pauseSong={handlePause}
      />
    </>
  )
}

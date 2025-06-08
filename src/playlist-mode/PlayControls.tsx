import React from "react"
import { useSpotifyContext } from "../contexts/SongContext"
import { PlayButtons } from "../components/PlayButtons"

export const PlayControls: React.FC = () => {
  const { playRandomSong, playTrack, setPlaying, song, pauseCurrentPlay } = useSpotifyContext()
  const [replayEnabled, setReplayEnabled] = React.useState(false)
  const playTimeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null)

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
    await playRandomSong()
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
    await playTrack(song.spotifyLink.replace("https://open.spotify.com/track/", "spotify:track:"))
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

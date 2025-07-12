import type React from "react"
import { useSpotifyContext } from "../contexts/SongContext"
import { FaPlay, FaPause, FaRedo } from "react-icons/fa"

interface PlayButtonsProps {
  replayEnabled: boolean
  playSong?: () => Promise<void>
  replaySong?: () => Promise<void>
  pauseSong?: () => Promise<void>
}

export const PlayButtons: React.FC<PlayButtonsProps> = ({
  replayEnabled,
  playSong,
  pauseSong,
  replaySong,
}) => {
  const { isPlaying } = useSpotifyContext()

  return (
    <div className="flex flex-col items-center gap-2 mb-4">
      <div className="flex gap-4">
        {(playSong || pauseSong) && (
          <button
            type="button"
            onClick={isPlaying ? pauseSong : playSong}
            disabled={isPlaying && !pauseSong}
            className="flex items-center justify-center w-12 h-12 rounded-full bg-green-600 hover:bg-green-700 disabled:bg-gray-500 text-white shadow transition focus:outline-none focus:ring-2 focus:ring-green-400"
            aria-label={isPlaying ? "Pause" : "Play Song"}
          >
            {isPlaying ? <FaPause size={28} /> : <FaPlay size={28} />}
          </button>
        )}
        <button
          type="button"
          onClick={replaySong}
          disabled={!replayEnabled}
          className="flex items-center justify-center w-12 h-12 rounded-full bg-yellow-500 hover:bg-yellow-600 disabled:bg-gray-500 text-white shadow transition focus:outline-none focus:ring-2 focus:ring-yellow-400"
          aria-label="Replay Previous Song"
        >
          <FaRedo size={28} />
        </button>
      </div>
    </div>
  )
}

import type React from "react"
import { useState } from "react"
import { useSpotifyContext } from "../contexts/SongContext"
import { FaMusic, FaUser, FaCalendarAlt } from "react-icons/fa"

const CollapsibleSongInfo: React.FC = () => {
  const [open, setOpen] = useState(false)
  const { song } = useSpotifyContext()
  if (!song) return null
  const { title, artist, year } = song
  return (
    <div className="w-full max-w-xs my-2">
      <button
        type="button"
        className="w-full flex justify-between items-center px-3 py-1 bg-gray-200 dark:bg-gray-700 rounded-t hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-100 text-sm font-semibold focus:outline-none"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
      >
        <span>Last Played Song</span>
        <span>{open ? "▲" : "▼"}</span>
      </button>
      {open && (
        <div className="bg-gray-100 dark:bg-gray-800 px-3 py-2 rounded-b text-xs text-gray-900 dark:text-gray-100 border-t border-gray-300 dark:border-gray-600">
          {title && (
            <div className="flex items-center gap-2 mt-1">
              <FaMusic className="inline text-pink-500" />
              <span className="font-semibold">Title:</span> {title}
            </div>
          )}
          {artist && (
            <div className="flex items-center gap-2 mt-1">
              <FaUser className="inline text-yellow-500" />
              <span className="font-semibold">Artist:</span> {artist}
            </div>
          )}
          {year && (
            <div className="flex items-center gap-2 mt-1">
              <FaCalendarAlt className="inline text-blue-500" />
              <span className="font-semibold">Year:</span> {year}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default CollapsibleSongInfo

import type React from "react"
import { useState } from "react"
import { useSpotifyContext } from "../contexts/SongContext"
import { FaMusic, FaUser, FaCalendarAlt } from "react-icons/fa"
import { MdKeyboardArrowUp, MdKeyboardArrowDown } from "react-icons/md"

const CollapsibleSongInfo: React.FC = () => {
  const [open, setOpen] = useState(false)
  const { song } = useSpotifyContext()
  if (!song) return null
  const { title, artist, year } = song
  return (
    <div className="w-full max-w-xs my-2">
      <button
        type="button"
        className="w-full flex justify-between items-center px-3 py-1 bg-gray-800 hover:bg-gray-700 rounded-t text-green-300 hover:text-green-200 text-sm font-semibold focus:outline-none"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
      >
        <span>Last Played Song</span>
        <span>{open ? <MdKeyboardArrowUp size={22} /> : <MdKeyboardArrowDown size={22} />}</span>
      </button>
      {open && (
        <div className="bg-gray-900 px-3 py-2 rounded-b text-sm text-gray-100 border border-green-700 border-t-0">
          {title && (
            <div className="flex items-center gap-2 mt-1">
              <FaMusic className="inline text-green-400" />
              <span className="font-semibold text-green-300">Title:</span>{" "}
              <span className="text-gray-100">{title}</span>
            </div>
          )}
          {artist && (
            <div className="flex items-center gap-2 mt-1">
              <FaUser className="inline text-emerald-400" />
              <span className="font-semibold text-emerald-300">Artist:</span>{" "}
              <span className="text-gray-100">{artist}</span>
            </div>
          )}
          {year && (
            <div className="flex items-center gap-2 mt-1">
              <FaCalendarAlt className="inline text-blue-400" />
              <span className="font-semibold text-blue-300">Year:</span>{" "}
              <span className="text-gray-100">{year}</span>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default CollapsibleSongInfo

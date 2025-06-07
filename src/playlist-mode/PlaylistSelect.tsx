import type { SimplifiedPlaylist } from "@spotify/web-api-ts-sdk"
import type React from "react"

interface PlaylistSelectProps {
  playlists: SimplifiedPlaylist[]
  loading: boolean
  setSelectedPlaylist: (pl: SimplifiedPlaylist | null) => void
}

export const PlaylistSelect: React.FC<PlaylistSelectProps> = ({
  playlists,
  loading,
  setSelectedPlaylist,
}) => {
  if (loading) return <div className="mb-4">Loading playlists...</div>
  if (playlists.length === 0) return <div className="mb-4">No playlists found.</div>
  return (
    <select
      className="px-3 py-2 rounded bg-gray-800 text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-green-400"
      onChange={(e) => {
        const pl = playlists.find((p) => p.id === e.target.value)
        setSelectedPlaylist(pl || null)
      }}
      defaultValue=""
    >
      <option value="" disabled>
        Select...
      </option>
      {playlists.map((pl) => (
        <option key={pl.id} value={pl.id}>
          {pl.name}
        </option>
      ))}
    </select>
  )
}

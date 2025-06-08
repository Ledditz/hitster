import type React from "react"
import { PlayControls } from "./PlayControls"
import { useSpotifyContext } from "../contexts/SongContext"
import { PlaylistSelect } from "./PlaylistSelect"
import CollapsibleSongInfo from "../components/CollapsibleSongInfo"
import { MdRefresh } from "react-icons/md"

interface PlaylistModeProps {
  logOut: () => void
  playbackMode: "beginning" | "custom" | "random"
  customStartTime: number
}

export const PlaylistMode: React.FC<PlaylistModeProps> = ({
  logOut,
  playbackMode,
  customStartTime,
}) => {
  const {
    selectedPlaylist,
    setSelectedPlaylist,
    availablePlaylists,
    isLoadingPlaylists,
    loadPlaylists,
  } = useSpotifyContext()

  return (
    <div className="flex flex-col items-center mt-8">
      {!selectedPlaylist ? (
        <>
          <div className="mb-2">Select a playlist:</div>
          <PlaylistSelect
            playlists={availablePlaylists}
            loading={isLoadingPlaylists}
            setSelectedPlaylist={setSelectedPlaylist}
          />
          <button
            type="button"
            onClick={loadPlaylists}
            className="mt-2 flex items-center justify-center w-10 h-10 rounded-full bg-blue-600 hover:bg-blue-700 text-white text-lg shadow disabled:opacity-50"
            disabled={isLoadingPlaylists}
            aria-label="Refresh Playlists"
          >
            <MdRefresh className={isLoadingPlaylists ? "animate-spin" : ""} size={24} />
          </button>
        </>
      ) : (
        <>
          <div className="mb-4">
            Activ playlist: <span className="font-bold">{selectedPlaylist.name}</span>
          </div>
          <PlayControls playbackMode={playbackMode} customStartTime={customStartTime} />
          <CollapsibleSongInfo />
          <button
            type="button"
            onClick={() => setSelectedPlaylist(null)}
            className="mt-2 px-3 py-1 rounded bg-gray-700 hover:bg-gray-800 text-white text-sm"
          >
            Change Playlist
          </button>
        </>
      )}
    </div>
  )
}

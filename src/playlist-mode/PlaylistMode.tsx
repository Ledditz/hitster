import type React from "react"
import { PlayControls } from "./PlayControls"
import { useSpotifyContext } from "../contexts/SongContext"
import type { Dispatch, SetStateAction } from "react"
import { PlaylistSelect } from "./PlaylistSelect"
import CollapsibleSongInfo from "../components/CollapsibleSongInfo"

interface PlaylistModeProps {
  setMode: (mode: "qr" | "playlist" | null) => void
  logOut: () => void
  setIsLoggedIn: Dispatch<SetStateAction<boolean>>
}

export const PlaylistMode: React.FC<PlaylistModeProps> = ({ setMode }) => {
  const { selectedPlaylist, setSelectedPlaylist, availablePlaylists, isLoadingPlaylists } =
    useSpotifyContext()

  return (
    <div className="flex flex-col items-center">
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
            onClick={() => setMode(null)}
            className="mt-2 px-3 py-1 rounded bg-gray-700 hover:bg-gray-800 text-white text-sm"
          >
            Back
          </button>
        </>
      ) : (
        <>
          <div className="mb-2">
            Selected playlist: <span className="font-bold">{selectedPlaylist.name}</span>
          </div>
          <PlayControls />
          <CollapsibleSongInfo />
          <button
            type="button"
            onClick={() => setSelectedPlaylist(null)}
            className="mt-2 px-3 py-1 rounded bg-gray-700 hover:bg-gray-800 text-white text-sm"
          >
            Change Playlist
          </button>
          <button
            type="button"
            onClick={() => setMode(null)}
            className="mt-2 px-3 py-1 rounded bg-gray-700 hover:bg-gray-800 text-white text-sm"
          >
            Back
          </button>
        </>
      )}
    </div>
  )
}

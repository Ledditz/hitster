import type React from "react"
import { createContext, useContext, useState } from "react"
import type { SimplifiedPlaylist, SpotifyApi } from "@spotify/web-api-ts-sdk"

export interface SongData {
  id: string
  spotifyLink: string
  artist: string
  title: string
  year: string
}

interface SpotifyContextType {
  song: SongData | null
  isPlaying: boolean
  selectedPlaylist: SimplifiedPlaylist | null
  spotifySdk: SpotifyApi | null
  setSongAndPlaying: (song: SongData | null, isPlaying: boolean) => void
  setPlaying: (isPlaying: boolean) => void
  setSelectedPlaylist: (playlist: SimplifiedPlaylist | null) => void
  setSpotifySdk: (sdk: SpotifyApi | null) => void
}

const SpotifyContext = createContext<SpotifyContextType | undefined>(undefined)

export const useSpotifyContext = () => {
  const ctx = useContext(SpotifyContext)
  if (!ctx) throw new Error("useSpotifyContext must be used within a SpotifyProvider")
  return ctx
}

export const SpotifyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [song, setSong] = useState<SongData | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [selectedPlaylist, setSelectedPlaylist] = useState<SimplifiedPlaylist | null>(null)
  const [spotifySdk, setSpotifySdk] = useState<SpotifyApi | null>(null)

  const setSongAndPlaying = (song: SongData | null, playing: boolean) => {
    setSong(song)
    setIsPlaying(playing)
  }

  const setPlaying = (playing: boolean) => {
    setIsPlaying(playing)
  }

  return (
    <SpotifyContext.Provider
      value={{
        song,
        isPlaying,
        selectedPlaylist,
        spotifySdk,
        setSongAndPlaying,
        setPlaying,
        setSelectedPlaylist,
        setSpotifySdk,
      }}
    >
      {children}
    </SpotifyContext.Provider>
  )
}

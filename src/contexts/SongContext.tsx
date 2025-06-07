import type React from "react"
import { createContext, useCallback, useContext, useEffect, useState } from "react"
import type { Device, SimplifiedPlaylist, SpotifyApi } from "@spotify/web-api-ts-sdk"
import { toast } from "sonner"

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
  availablePlaylists: SimplifiedPlaylist[]
  availableDevices: Device[]
  currentDeviceId: string | null
  isLoadingPlaylists: boolean
  isLoadingDevices: boolean
  setCurrentDevice: (deviceId: string | null) => Promise<void>
  setSong: (song: SongData | null) => void
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
  const [availablePlaylists, setAvailablePlaylists] = useState<SimplifiedPlaylist[]>([])
  const [availableDevices, setAvailableDevices] = useState<Device[]>([])
  const [currentDeviceId, setCurrentDeviceId] = useState<string | null>(null)
  const [isLoadingPlaylists, setIsLoadingPlaylists] = useState(false)
  const [isLoadingDevices, setIsLoadingDevices] = useState(false)

  useEffect(() => {
    if (spotifySdk) {
      const fetchPlaylists = async () => {
        try {
          setIsLoadingPlaylists(true)
          const playlistsResponse = await spotifySdk.currentUser.playlists.playlists()
          setAvailablePlaylists(playlistsResponse.items)
        } catch (error) {
          console.error("Failed to fetch playlists:", error)
          setAvailablePlaylists([])
        } finally {
          setIsLoadingPlaylists(false)
        }
      }

      const fetchDevices = async () => {
        try {
          setIsLoadingDevices(true)
          const devicesResponse = await spotifySdk.player.getAvailableDevices()
          setAvailableDevices(devicesResponse.devices)
          const active = devicesResponse.devices.find((d) => d.is_active)
          setCurrentDeviceId(active ? active.id : devicesResponse.devices[0]?.id || null)
        } catch (e) {
          console.error("Failed to fetch devices:", e)
          setAvailableDevices([])
        } finally {
          setIsLoadingDevices(false)
        }
      }
      fetchDevices()
      fetchPlaylists()
    }
  }, [spotifySdk])

  const setSongAndPlaying = (song: SongData | null, playing: boolean) => {
    setSong(song)
    setIsPlaying(playing)
  }

  const setPlaying = (playing: boolean) => {
    setIsPlaying(playing)
  }

  // Set device and update Spotify API
  const setDevice = useCallback(
    async (deviceId: string | null) => {
      if (!spotifySdk || !deviceId) return
      try {
        await spotifySdk.player.transferPlayback([deviceId], false)
        setCurrentDeviceId(deviceId)
        const devicesResponse = await spotifySdk.player.getAvailableDevices()
        setAvailableDevices(devicesResponse.devices)
      } catch (e) {
        toast.error("Failed to transfer playback to selected device.")
      }
    },
    [spotifySdk],
  )

  return (
    <SpotifyContext.Provider
      value={{
        song,
        isPlaying,
        selectedPlaylist,
        spotifySdk,
        availablePlaylists,
        currentDeviceId,
        availableDevices,
        isLoadingPlaylists,
        isLoadingDevices,
        setCurrentDevice: setDevice,
        setSong,
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

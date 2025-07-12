import type React from "react"
import { createContext, useCallback, useContext, useEffect, useState } from "react"
import type { Device, SimplifiedPlaylist, SpotifyApi, TrackItem } from "@spotify/web-api-ts-sdk"
import { toast } from "sonner"
import { logOut as globalLogOut } from "../utils/spotifyAuth"

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
  logOut: () => void
  playTrack: (trackUri: string, startTime: number) => Promise<void>
  playRandomSong: () => Promise<void>
  pauseCurrentPlay: () => Promise<void>
  loadPlaylists: () => Promise<void>
  loadDevices: () => Promise<void>
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

  const fetchPlaylists = async () => {
    try {
      if (!spotifySdk) return
      setIsLoadingPlaylists(true)
      const playlistsResponse = await spotifySdk.currentUser.playlists.playlists()
      setAvailablePlaylists(playlistsResponse.items)
    } catch (error) {
      console.error("Failed to fetch playlists:", error)
      toast.error("Failed loading playlists")
      setAvailablePlaylists([])
    } finally {
      setIsLoadingPlaylists(false)
    }
  }

  const fetchDevices = async () => {
    try {
      if (!spotifySdk) return
      setIsLoadingDevices(true)
      const devicesResponse = await spotifySdk.player.getAvailableDevices()
      setAvailableDevices(devicesResponse.devices)
      const active = devicesResponse.devices.find((d) => d.is_active)
      setCurrentDeviceId(active ? active.id : devicesResponse.devices[0]?.id || null)
    } catch (e) {
      console.error("Failed to fetch devices:", e)
      toast.error("Failed loading devices")
      setAvailableDevices([])
    } finally {
      setIsLoadingDevices(false)
    }
  }

  // biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
  useEffect(() => {
    if (spotifySdk) {
      fetchDevices()
      fetchPlaylists()
    }
  }, [spotifySdk])

  const setSongAndPlaying = useCallback((song: SongData | null, playing: boolean) => {
    setSong(song)
    setIsPlaying(playing)
  }, [])

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

  // Centralized logout for context
  const logOut = useCallback(() => {
    setSpotifySdk(null)
    setSong(null)
    setIsPlaying(false)
    setSelectedPlaylist(null)
    setAvailablePlaylists([])
    setAvailableDevices([])
    setCurrentDeviceId(null)
    globalLogOut(
      () => {},
      () => {},
    )
  }, [])

  // Helper for Spotify API calls with 401 handling
  const callSpotifyApi = useCallback(
    async (fn: () => Promise<unknown>) => {
      try {
        return await fn()
      } catch (e) {
        // Try to detect 401 from fetch or SDK error
        if (
          (e &&
            typeof e === "object" &&
            "status" in e &&
            (e as { status?: number }).status === 401) ||
          (e &&
            typeof e === "object" &&
            "response" in e &&
            (e as { response?: { status?: number } }).response?.status === 401)
        ) {
          toast.error("Spotify session expired. Please log in again.")
          logOut()
        } else {
          throw e
        }
      }
    },
    [logOut],
  )

  // Play a track by URI
  const playTrack = useCallback(
    async (trackUri: string, position_ms = 30000) => {
      if (!spotifySdk || !currentDeviceId) return
      await callSpotifyApi(async () => {
        await fetch(`https://api.spotify.com/v1/me/player/play?device_id=${currentDeviceId}`, {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("spotify_access_token")}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ uris: [trackUri], position_ms }),
        })
      })
    },
    [spotifySdk, currentDeviceId, callSpotifyApi],
  )

  // Play random song from selected playlist
  const playRandomSong = useCallback(
    async (position_ms = 30000) => {
      if (!spotifySdk || !selectedPlaylist || !currentDeviceId) return
      setIsPlaying(true)
      await callSpotifyApi(async () => {
        const tracks = await spotifySdk.playlists.getPlaylistItems(selectedPlaylist.id)
        const validTracks = tracks.items
          .map((item: { track: TrackItem }) => item.track)
          .filter((track: TrackItem) => track?.uri && track.type === "track")
        if (!validTracks.length) return
        const randomTrack = validTracks[Math.floor(Math.random() * validTracks.length)]
        setSongAndPlaying(
          {
            id: randomTrack.id,
            spotifyLink: `spotify:track:${randomTrack.id}`,
            artist:
              (randomTrack.type === "track" &&
                "artists" in randomTrack &&
                randomTrack.artists?.[0]?.name) ||
              "",
            title: randomTrack.name,
            year: "",
          },
          true,
        )
        await playTrack(randomTrack.uri, position_ms)
      })
      // Do not setIsPlaying(false) here; let pauseCurrentPlay handle it;
    },
    [spotifySdk, selectedPlaylist, currentDeviceId, playTrack, callSpotifyApi, setSongAndPlaying],
  )

  // Pause playback on the current device
  const pauseCurrentPlay = useCallback(async () => {
    if (!spotifySdk || !currentDeviceId) return
    await callSpotifyApi(async () => {
      try {
        await spotifySdk.player.pausePlayback(currentDeviceId)
      } catch (error) {
        console.log(error)
      } finally {
        // Only set isPlaying to false if pause succeeds
        setIsPlaying(false)
      }
    })
  }, [spotifySdk, currentDeviceId, callSpotifyApi])

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
        logOut, // Expose logout
        playTrack, // Expose playback helpers
        playRandomSong,
        pauseCurrentPlay, // Expose pause
        loadPlaylists: fetchPlaylists,
        loadDevices: fetchDevices, // Expose loading functions
      }}
    >
      {children}
    </SpotifyContext.Provider>
  )
}

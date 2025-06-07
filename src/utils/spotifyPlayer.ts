// Handles Spotify device and playback logic
import type { Device, SpotifyApi } from "@spotify/web-api-ts-sdk"
import { toast } from "sonner"

export async function fetchDevices(
  spotifySdk: SpotifyApi,
  setDevices: (d: Device[]) => void,
  setSelectedDeviceId: (id: string | null) => void,
) {
  try {
    const devicesResponse = await spotifySdk.player.getAvailableDevices()
    setDevices(devicesResponse.devices)
    const active = devicesResponse.devices.find((d) => d.is_active)
    setSelectedDeviceId(active ? active.id : devicesResponse.devices[0]?.id || null)
  } catch (e) {
    setDevices([])
    toast.error("Failed to fetch Spotify devices.")
  }
}

export async function transferPlayback(
  spotifySdk: SpotifyApi,
  deviceId: string,
  setSelectedDeviceId: (id: string) => void,
  setDevices: (d: Device[]) => void,
) {
  try {
    await spotifySdk.player.transferPlayback([deviceId], false)
    setSelectedDeviceId(deviceId)
    const devicesResponse = await spotifySdk.player.getAvailableDevices()
    setDevices(devicesResponse.devices)
    toast.success("Playback transferred to selected device.")
  } catch (e) {
    toast.error("Failed to transfer playback to selected device.")
  }
}

export async function playRandomSong(
  spotifySdk: SpotifyApi,
  selectedDeviceId: string | null,
  logOut: () => void,
) {
  try {
    const playlists = await spotifySdk.currentUser.playlists.playlists()
    if (!playlists.items.length) {
      toast.error("No playlists found!")
      return
    }
    const randomPlaylist = playlists.items[Math.floor(Math.random() * playlists.items.length)]
    const tracks = await spotifySdk.playlists.getPlaylistItems(randomPlaylist.id)
    if (!tracks.items.length) {
      toast.error("No tracks found in the playlist!")
      return
    }
    const validTracks = tracks.items.map((item) => item.track).filter((track) => track?.uri)
    if (!validTracks.length) {
      toast.error("No playable tracks found in the playlist!")
      return
    }
    const randomTrack = validTracks[Math.floor(Math.random() * validTracks.length)]
    const devicesResponse = await spotifySdk.player.getAvailableDevices()
    const activeDevice =
      devicesResponse.devices.find((d) => d.id === selectedDeviceId) ||
      devicesResponse.devices.find((d) => d.is_active)
    if (!activeDevice) {
      toast.error(
        "No active Spotify device found. Please open Spotify on one of your devices and start playing any song, then try again.",
      )
      return
    }
    await fetch(`https://api.spotify.com/v1/me/player/play?device_id=${activeDevice.id || ""}`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${localStorage.getItem("spotify_access_token")}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        uris: [randomTrack.uri],
        position_ms: 30000,
      }),
    })
    toast.success(`Playing a random song from playlist: ${randomPlaylist.name}`)
    setTimeout(async () => {
      try {
        await spotifySdk.player.pausePlayback(activeDevice.id || "")
      } catch (e) {
        console.error("Failed to pause playback:", e)
      }
    }, 10000)
  } catch (err) {
    console.error("Spotify playback error:", err)
    if (err instanceof Error && err.message) {
      toast.error(
        `Failed to play a random song: ${err.message}\nMake sure you have Spotify Premium, an active device, and the correct permissions.`,
      )
    } else {
      toast.error(
        "Failed to play a random song. Make sure you have Spotify Premium, an active device, and the correct permissions.",
      )
    }
    logOut()
  }
}

export async function getCurrentPlayback(spotifySdk: SpotifyApi) {
  try {
    const playback = await spotifySdk.player.getPlaybackState()
    if (!playback || !playback.item) {
      return null
    }
    return playback.item
  } catch (e) {
    console.error("Failed to fetch current playback:", e)
    return null
  }
}

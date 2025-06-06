import { useState, useEffect } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import { SpotifyApi } from '@spotify/web-api-ts-sdk'
import { handleSpotifyRedirect, getValidSpotifyToken, handleSpotifyLogin, logOut, SPOTIFY_CLIENT_ID } from './spotifyAuth';
import { fetchDevices } from './spotifyPlayer';
import { useQrScanner } from './qrScanner';

// Use import.meta.env for Vite env variables
function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [spotifySdk, setSpotifySdk] = useState<SpotifyApi | null>(null)
  const [devices, setDevices] = useState<any[]>([])
  const [selectedDeviceId, setSelectedDeviceId] = useState<string | null>(null)

  // Use QR scanner hook
  const { scanning, qrResult, barcodeError, startQrScanner, cancelQrScanner } = useQrScanner();

  // Handle Spotify OAuth redirect
  useEffect(() => {
    handleSpotifyRedirect(setIsLoggedIn, setShowSuccess);
  }, []);

  useEffect(() => {
    (async () => {
      const token = await getValidSpotifyToken(setIsLoggedIn, setSpotifySdk);
      if (token) {
        setSpotifySdk(SpotifyApi.withAccessToken(
          SPOTIFY_CLIENT_ID,
          {
            access_token: token,
            token_type: 'Bearer',
            expires_in: 3600,
            expires: 0, // dummy value, not used
            refresh_token: '' // not used for implicit flow
          }
        ))
        setIsLoggedIn(true)
      }
    })()
  }, [isLoggedIn])

  // Fetch available devices on login
  useEffect(() => {
    if (isLoggedIn && spotifySdk) {
      fetchDevices(spotifySdk, setDevices, setSelectedDeviceId);
    }
  }, [isLoggedIn, spotifySdk])

  // Set active device via API
  const handleTransferPlayback = async (deviceId: string) => {
    if (!spotifySdk) return
    try {
      await spotifySdk.player.transferPlayback([deviceId], false)
      setSelectedDeviceId(deviceId)
      // Optionally, refetch devices to update active status
      const devicesResponse = await spotifySdk.player.getAvailableDevices()
      setDevices(devicesResponse.devices)
    } catch (e) {
      alert('Failed to transfer playback to selected device.')
    }
  }

  // Play random song
  const handlePlayRandomSong = async () => {
    if (!spotifySdk) {
      alert('You must be logged in to Spotify!')
      logOut(setIsLoggedIn, setSpotifySdk);
      return
    }
    try {
      // Get user's playlists
      const playlists = await spotifySdk.currentUser.playlists.playlists()
      if (!playlists.items.length) {
        alert('No playlists found!')
        return
      }
      // Pick a random playlist
      const randomPlaylist = playlists.items[Math.floor(Math.random() * playlists.items.length)]
      // Get tracks from the playlist
      const tracks = await spotifySdk.playlists.getPlaylistItems(randomPlaylist.id)
      if (!tracks.items.length) {
        alert('No tracks found in the playlist!')
        return
      }
      // Filter for valid tracks with a URI
      const validTracks = tracks.items.map((item: any) => item.track).filter((track: any) => track && track.uri)
      if (!validTracks.length) {
        alert('No playable tracks found in the playlist!')
        return
      }
      // Pick a random valid track
      const randomTrack = validTracks[Math.floor(Math.random() * validTracks.length)]
      // Get user's devices
      const devicesResponse = await spotifySdk.player.getAvailableDevices()
      const activeDevice = devicesResponse.devices.find((d: any) => d.id === selectedDeviceId) || devicesResponse.devices.find((d: any) => d.is_active)
      if (!activeDevice) {
        alert('No active Spotify device found. Please open Spotify on one of your devices and start playing any song, then try again.')
        return
      }
      // Use fetch to play the track at 30s on the selected/active device
      await fetch(`https://api.spotify.com/v1/me/player/play?device_id=${activeDevice.id || ''}`,
        {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('spotify_access_token')}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            uris: [randomTrack.uri],
            position_ms: 30000
          })
        }
      )
      // Pause playback after 10 seconds
      setTimeout(async () => {
        try {
          await spotifySdk.player.pausePlayback(activeDevice.id || '')
        } catch (e) {
          console.error('Failed to pause playback:', e)
        }
      }, 10000)
      // Handle both Track and Episode objects
      let trackName = (randomTrack as any).name
      let artistNames = ''
      if ('artists' in randomTrack && Array.isArray((randomTrack as any).artists)) {
        artistNames = (randomTrack as any).artists.map((a: any) => a.name).join(', ')
      } else if ((randomTrack as any).show && typeof (randomTrack as any).show.name === 'string') {
        artistNames = (randomTrack as any).show.name
      }
      alert(`Playing: ${trackName}${artistNames ? ' by ' + artistNames : ''}`)
    } catch (err: any) {
      console.error('Spotify playback error:', err)
      if (err && err.message) {
        alert('Failed to play a random song: ' + err.message + '\nMake sure you have Spotify Premium, an active device, and the correct permissions.')
      } else {
        alert('Failed to play a random song. Make sure you have Spotify Premium, an active device, and the correct permissions.')
      }
      logOut(setIsLoggedIn, setSpotifySdk);
    }
  }

  return (
    <div className="App">
      <div>
        <a href="https://vite.dev" target="_blank">
          <img src={viteLogo} className="logo" alt="Vite logo" />
        </a>
        <a href="https://react.dev" target="_blank">
          <img src={reactLogo} className="logo react" alt="React logo" />
        </a>
      </div>
      <h1>Spotify QR Scanner</h1>
      {!isLoggedIn ? (
        <button onClick={handleSpotifyLogin}>Login with Spotify</button>
      ) : (
        <>
          {showSuccess && (
            <div style={{ color: 'green', marginBottom: 16 }}>
              Successfully logged in to Spotify!
            </div>
          )}
          <button onClick={startQrScanner} disabled={scanning}>
            {scanning ? 'Scanning...' : 'Scan QR Code'}
          </button>
          {scanning && (
            <button onClick={cancelQrScanner} style={{ marginLeft: 8 }}>
              Cancel Scan
            </button>
          )}
          <div id="qr-video-container" />
          {barcodeError && <div style={{ color: 'red' }}>{barcodeError}</div>}
          {qrResult && <p>Last scanned QR: {qrResult}</p>}
          <button onClick={handlePlayRandomSong} disabled={!isLoggedIn} style={{ marginBottom: 16 }}>
            Play Random Song from Spotify
          </button>
          {isLoggedIn && devices.length > 0 && (
            <div style={{ margin: '16px 0' }}>
              <label htmlFor="device-select">Select Spotify Device: </label>
              <select
                id="device-select"
                value={selectedDeviceId || ''}
                onChange={e => handleTransferPlayback(e.target.value)}
              >
                {devices.map(device => (
                  <option key={device.id} value={device.id}>
                    {device.name} {device.is_active ? '(Active)' : ''}
                  </option>
                ))}
              </select>
            </div>
          )}
        </>
      )}
    </div>
  )
}

export default App

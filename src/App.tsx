import { useState, useEffect } from 'react'
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
  const [isPlaying, setIsPlaying] = useState(false)
  const [lastPlayedTrack, setLastPlayedTrack] = useState<any | null>(null)
  const [replayEnabled, setReplayEnabled] = useState(false)

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
      setIsPlaying(true);
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
      setLastPlayedTrack(randomTrack)
      setReplayEnabled(true)
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
        setIsPlaying(false);
      }, 10000)
      // Handle both Track and Episode objects
      let trackName = (randomTrack as any).name
      let artistNames = ''
      if ('artists' in randomTrack && Array.isArray((randomTrack as any).artists)) {
        artistNames = (randomTrack as any).artists.map((a: any) => a.name).join(', ')
      } else if ((randomTrack as any).show && typeof (randomTrack as any).show.name === 'string') {
        artistNames = (randomTrack as any).show.name
      }
    } catch (err: any) {
      setIsPlaying(false);
      console.error('Spotify playback error:', err)
      if (err && err.message) {
        alert('Failed to play a random song: ' + err.message + '\nMake sure you have Spotify Premium, an active device, and the correct permissions.')
      } else {
        alert('Failed to play a random song. Make sure you have Spotify Premium, an active device, and the correct permissions.')
      }
      logOut(setIsLoggedIn, setSpotifySdk);
    }
  }

  // Replay last played song
  const handleReplaySong = async () => {
    if (!spotifySdk || !lastPlayedTrack) return;
    try {
      setIsPlaying(true);
      const devicesResponse = await spotifySdk.player.getAvailableDevices()
      const activeDevice = devicesResponse.devices.find((d: any) => d.id === selectedDeviceId) || devicesResponse.devices.find((d: any) => d.is_active)
      if (!activeDevice) {
        alert('No active Spotify device found. Please open Spotify on one of your devices and start playing any song, then try again.')
        setIsPlaying(false);
        return
      }
      await fetch(`https://api.spotify.com/v1/me/player/play?device_id=${activeDevice.id || ''}`,
        {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('spotify_access_token')}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            uris: [lastPlayedTrack.uri],
            position_ms: 30000
          })
        }
      )
      setTimeout(async () => {
        try {
          await spotifySdk.player.pausePlayback(activeDevice.id || '')
        } catch (e) {
          console.error('Failed to pause playback:', e)
        }
        setIsPlaying(false);
      }, 10000)
    } catch (err: any) {
      setIsPlaying(false);
      console.error('Spotify playback error:', err)
      if (err && err.message) {
        alert('Failed to replay the song: ' + err.message + '\nMake sure you have Spotify Premium, an active device, and the correct permissions.')
      } else {
        alert('Failed to replay the song. Make sure you have Spotify Premium, an active device, and the correct permissions.')
      }
      logOut(setIsLoggedIn, setSpotifySdk);
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-indigo-900 via-purple-900 to-black text-white font-sans">
      <div className="flex flex-col items-center mb-8">
        <div className="mb-4 flex flex-col items-center">
          {/* Animated Logo: Music note SVG with bounce only when playing */}
          <svg width="56" height="56" viewBox="0 0 56 56" fill="none" xmlns="http://www.w3.org/2000/svg" className={`mb-2 drop-shadow-lg${isPlaying ? ' bounce-spotify-logo' : ''}`}>
            <circle cx="28" cy="28" r="28" fill="#1DB954"/>
            <path d="M38 16v18.5a6.5 6.5 0 1 1-2-4.6V22h-10v10.5a6.5 6.5 0 1 1-2-4.6V16h14z" fill="#fff"/>
          </svg>
          {/* Modern animated sound wave (SVG) */}
          <svg width="80" height="32" viewBox="0 0 80 32" fill="none" xmlns="http://www.w3.org/2000/svg" className="block">
            <rect x="5" y={isPlaying ? '8' : '8'} width="6" height={isPlaying ? undefined : '16'} rx="3" fill="#34d399">
              {isPlaying && <animate attributeName="height" values="8;24;8" dur="1s" repeatCount="indefinite"/>}
              {isPlaying && <animate attributeName="y" values="12;0;12" dur="1s" repeatCount="indefinite"/>}
            </rect>
            <rect x="19" y={isPlaying ? '4' : '4'} width="6" height={isPlaying ? undefined : '24'} rx="3" fill="#10b981">
              {isPlaying && <animate attributeName="height" values="24;8;24" dur="1.2s" repeatCount="indefinite"/>}
              {isPlaying && <animate attributeName="y" values="0;12;0" dur="1.2s" repeatCount="indefinite"/>}
            </rect>
            <rect x="33" y={isPlaying ? '10' : '14'} width="6" height={isPlaying ? undefined : '8'} rx="3" fill="#6ee7b7">
              {isPlaying && <animate attributeName="height" values="12;28;12" dur="0.9s" repeatCount="indefinite"/>}
              {isPlaying && <animate attributeName="y" values="10;0;10" dur="0.9s" repeatCount="indefinite"/>}
            </rect>
            <rect x="47" y={isPlaying ? '6' : '4'} width="6" height={isPlaying ? undefined : '24'} rx="3" fill="#059669">
              {isPlaying && <animate attributeName="height" values="20;8;20" dur="1.1s" repeatCount="indefinite"/>}
              {isPlaying && <animate attributeName="y" values="6;16;6" dur="1.1s" repeatCount="indefinite"/>}
            </rect>
            <rect x="61" y={isPlaying ? '12' : '8'} width="6" height={isPlaying ? undefined : '16'} rx="3" fill="#34d399">
              {isPlaying && <animate attributeName="height" values="8;24;8" dur="1.3s" repeatCount="indefinite"/>}
              {isPlaying && <animate attributeName="y" values="12;0;12" dur="1.3s" repeatCount="indefinite"/>}
            </rect>
          </svg>
        </div>
        <h1 className="text-4xl font-extrabold tracking-tight mb-2 drop-shadow-lg">Spotify QR Scanner</h1>
        <p className="text-lg text-gray-300 mb-2">Connect to your music, instantly.</p>
      </div>
      {!isLoggedIn ? (
        <button onClick={handleSpotifyLogin} className="px-6 py-2 rounded bg-green-500 hover:bg-green-600 text-white font-semibold shadow transition">Login with Spotify</button>
      ) : (
        <>
          {showSuccess && (
            <div className="text-green-400 mb-4 font-medium">Successfully logged in to Spotify!</div>
          )}
          <button onClick={startQrScanner} disabled={scanning} className="px-4 py-2 rounded bg-blue-500 hover:bg-blue-600 disabled:bg-gray-500 text-white font-semibold shadow transition mb-2">
            {scanning ? 'Scanning...' : 'Scan QR Code'}
          </button>
          {scanning && (
            <button onClick={cancelQrScanner} className="ml-2 px-4 py-2 rounded bg-red-500 hover:bg-red-600 text-white font-semibold shadow transition mb-2">Cancel Scan</button>
          )}
          <div id="qr-video-container" className="my-4" />
          {barcodeError && <div className="text-red-400 mb-2">{barcodeError}</div>}
          {qrResult && <p className="mb-2">Last scanned QR: <span className="font-mono bg-gray-800 px-2 py-1 rounded">{qrResult}</span></p>}
          {/* Play Random Song Icon Button */}
          <div className="flex gap-4 mb-4">
            <button
              onClick={handlePlayRandomSong}
              disabled={!isLoggedIn}
              className="flex items-center justify-center w-12 h-12 rounded-full bg-green-600 hover:bg-green-700 disabled:bg-gray-500 text-white shadow transition focus:outline-none focus:ring-2 focus:ring-green-400"
              aria-label="Play Random Song from Spotify"
            >
              {/* Play Icon SVG */}
              <svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="14" cy="14" r="14" fill="#22c55e"/>
                <polygon points="11,8 22,14 11,20" fill="#fff"/>
              </svg>
            </button>
            <button
              onClick={handleReplaySong}
              disabled={!replayEnabled}
              className="flex items-center justify-center w-12 h-12 rounded-full bg-yellow-500 hover:bg-yellow-600 disabled:bg-gray-500 text-white shadow transition focus:outline-none focus:ring-2 focus:ring-yellow-400"
              aria-label="Replay Previous Song"
            >
              {/* Replay Icon SVG */}
              <svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="14" cy="14" r="14" fill="#facc15"/>
                <path d="M10 14a4 4 0 1 1 4 4" stroke="#fff" strokeWidth="2" fill="none"/>
                <polygon points="8,14 12,12 12,16" fill="#fff"/>
              </svg>
            </button>
          </div>
          {isLoggedIn && devices.length > 0 && (
            <div className="my-4 flex flex-col items-center">
              <label htmlFor="device-select" className="mb-1">Select Spotify Device:</label>
              <select
                id="device-select"
                value={selectedDeviceId || ''}
                onChange={e => handleTransferPlayback(e.target.value)}
                className="px-3 py-2 rounded bg-gray-800 text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-green-400"
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

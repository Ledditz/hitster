import { useState, useEffect } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import pkceChallenge from 'pkce-challenge'
import QrScanner from 'qr-scanner'
import { SpotifyApi } from '@spotify/web-api-ts-sdk'

// Use import.meta.env for Vite env variables
const SPOTIFY_CLIENT_ID = import.meta.env.VITE_SPOTIFY_CLIENT_ID
const SPOTIFY_REDIRECT_URI = import.meta.env.VITE_REDIRECT_URI
const SPOTIFY_SCOPES = 'user-read-private user-read-email user-modify-playback-state user-read-playback-state streaming'
function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [scanning, setScanning] = useState(false)
  const [qrResult, setQrResult] = useState<string | null>(null)
  const [showSuccess, setShowSuccess] = useState(false)
  const [qrScannerInstance, setQrScannerInstance] = useState<QrScanner | null>(null)
  const [qrVideoRef, setQrVideoRef] = useState<HTMLVideoElement | null>(null)
  const [barcodeError, setBarcodeError] = useState<string | null>(null)
  const [spotifySdk, setSpotifySdk] = useState<SpotifyApi | null>(null)
  const [devices, setDevices] = useState<any[]>([])
  const [selectedDeviceId, setSelectedDeviceId] = useState<string | null>(null)

  // Handle Spotify OAuth redirect
  useEffect(() => {
    // Check for authorization code in URL
    const urlParams = new URLSearchParams(window.location.search)
    const code = urlParams.get('code')
    if (code) {
      // Exchange code for access token
      const storedVerifier = localStorage.getItem('spotify_code_verifier')
      if (storedVerifier) {
        fetch('https://accounts.spotify.com/api/token', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: new URLSearchParams({
            client_id: SPOTIFY_CLIENT_ID,
            grant_type: 'authorization_code',
            code,
            redirect_uri: SPOTIFY_REDIRECT_URI,
            code_verifier: storedVerifier,
          }),
        })
          .then((res) => res.json())
          .then((data) => {
            if (data.access_token) {
              setIsLoggedIn(true)
              setShowSuccess(true)
              localStorage.setItem('spotify_access_token', data.access_token)
              if (data.refresh_token) {
                localStorage.setItem('spotify_refresh_token', data.refresh_token)
              }
              if (data.expires_in) {
                const expiresAt = Date.now() + data.expires_in * 1000
                localStorage.setItem('spotify_expires_at', expiresAt.toString())
              }
              window.history.replaceState({}, document.title, '/')
            } else {
              alert('Failed to log in to Spotify. Please try again. ' + (data.error_description || data.error || ''))
            }
          })
          .catch((err) => {
            alert('An error occurred while logging in to Spotify. Please try again. ' + (err?.message || err))
          })
      }
    } else {
      // Check if already logged in (e.g., after reload)
      const token = localStorage.getItem('spotify_access_token')
      if (token) {
        setIsLoggedIn(true)
      }
    }
  }, [])

  useEffect(() => {
    (async () => {
      const token = await getValidSpotifyToken()
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
    const fetchDevices = async () => {
      if (spotifySdk) {
        try {
          const devicesResponse = await spotifySdk.player.getAvailableDevices()
          setDevices(devicesResponse.devices)
          const active = devicesResponse.devices.find((d: any) => d.is_active)
          setSelectedDeviceId(active ? active.id : devicesResponse.devices[0]?.id || null)
        } catch (e) {
          setDevices([])
        }
      }
    }
    if (isLoggedIn && spotifySdk) {
      fetchDevices()
    }
  }, [isLoggedIn, spotifySdk])

  // Helper to refresh Spotify access token if expired
  const getValidSpotifyToken = async () => {
    const accessToken = localStorage.getItem('spotify_access_token')
    const expiresAt = localStorage.getItem('spotify_expires_at')
    const refreshToken = localStorage.getItem('spotify_refresh_token')
    if (!accessToken || !expiresAt || !refreshToken) return null
    if (Date.now() < parseInt(expiresAt)) {
      return accessToken
    }
    // Token expired, refresh it
    const params = new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
      client_id: SPOTIFY_CLIENT_ID,
    })
    const response = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params.toString(),
    })
    const data = await response.json()
    if (data.access_token) {
      localStorage.setItem('spotify_access_token', data.access_token)
      if (data.expires_in) {
        const expiresAt = Date.now() + data.expires_in * 1000
        localStorage.setItem('spotify_expires_at', expiresAt.toString())
      }
      return data.access_token
    } else {
      // Token refresh failed, force logout
      setIsLoggedIn(false)
      setSpotifySdk(null)
      localStorage.removeItem('spotify_access_token')
      localStorage.removeItem('spotify_refresh_token')
      localStorage.removeItem('spotify_expires_at')
      return null
    }
  }

  const handleSpotifyLogin = async () => {
    try {
      if (!window.crypto || !window.crypto.subtle || typeof window.crypto.subtle.digest !== 'function') {
        alert('Your browser does not support the required cryptography features for Spotify login (PKCE S256). Please open this app in a modern browser such as Chrome, Firefox, Safari, or Edge. If you are using an in-app browser, please open the link in your device\'s default browser.')
        return
      }
      const pkce = await pkceChallenge()
      const code_verifier = pkce.code_verifier
      const code_challenge = pkce.code_challenge
      localStorage.setItem('spotify_code_verifier', code_verifier)
      const authUrl = `https://accounts.spotify.com/authorize?client_id=${SPOTIFY_CLIENT_ID}` +
        `&response_type=code` +
        `&redirect_uri=${encodeURIComponent(SPOTIFY_REDIRECT_URI)}` +
        `&scope=${encodeURIComponent(SPOTIFY_SCOPES)}` +
        `&code_challenge_method=S256` +
        `&code_challenge=${code_challenge}`
      window.location.href = authUrl
    } catch (err: any) {
      alert('Failed to start Spotify login: ' + (err && err.message ? err.message : String(err)))
    }
  }

  const startQrScannerWithQrScanner = () => {
    setScanning(true)
    setQrResult(null)
    setBarcodeError(null)
    if (qrScannerInstance) {
      qrScannerInstance.destroy()
      setQrScannerInstance(null)
    }
    let videoElem = document.getElementById('qr-video') as HTMLVideoElement | null
    if (!videoElem) {
      videoElem = document.createElement('video')
      videoElem.id = 'qr-video'
      videoElem.style.width = '300px'
      videoElem.style.height = '300px'
      videoElem.style.margin = '20px auto'
      videoElem.style.display = 'block'
      document.getElementById('qr-video-container')?.appendChild(videoElem)
    }
    setQrVideoRef(videoElem)
    const scanner = new QrScanner(
      videoElem,
      (result) => {
        setQrResult(result.data)
        setScanning(false)
        scanner.stop()
        setQrScannerInstance(null)
        // Log QR code to console
        console.log('Scanned QR code:', result.data)
      },
      {
        highlightScanRegion: true,
        highlightCodeOutline: true,
      }
    )
    setQrScannerInstance(scanner)
    scanner.start().catch((err) => {
      setBarcodeError('Failed to start qr-scanner: ' + err)
      setScanning(false)
    })
  }

  const cancelQrScannerWithQrScanner = () => {
    if (qrScannerInstance) {
      qrScannerInstance.stop()
      qrScannerInstance.destroy()
      setQrScannerInstance(null)
    }
    setScanning(false)
    if (qrVideoRef) {
      qrVideoRef.remove()
      setQrVideoRef(null)
    }
  }

  const logOut = ()=>{
      setIsLoggedIn(false)
      setSpotifySdk(null)
      localStorage.removeItem('spotify_access_token')
      localStorage.removeItem('spotify_refresh_token')
      localStorage.removeItem('spotify_expires_at')

  }

  // Set active device via API
  const transferPlayback = async (deviceId: string) => {
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

  const playRandomSong = async () => {
    if (!spotifySdk) {
      alert('You must be logged in to Spotify!')
      logOut();
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
      logOut();
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
          <button onClick={startQrScannerWithQrScanner} disabled={scanning}>
            {scanning ? 'Scanning...' : 'Scan QR Code'}
          </button>
          {scanning && (
            <button onClick={cancelQrScannerWithQrScanner} style={{ marginLeft: 8 }}>
              Cancel Scan
            </button>
          )}
          <div id="qr-video-container" />
          {barcodeError && <div style={{ color: 'red' }}>{barcodeError}</div>}
          {qrResult && <p>Last scanned QR: {qrResult}</p>}
          <button onClick={playRandomSong} disabled={!isLoggedIn} style={{ marginBottom: 16 }}>
            Play Random Song from Spotify
          </button>
          {isLoggedIn && devices.length > 0 && (
            <div style={{ margin: '16px 0' }}>
              <label htmlFor="device-select">Select Spotify Device: </label>
              <select
                id="device-select"
                value={selectedDeviceId || ''}
                onChange={e => transferPlayback(e.target.value)}
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

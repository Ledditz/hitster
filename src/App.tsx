import { useState, useEffect } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import { Html5Qrcode } from 'html5-qrcode'
import pkceChallenge from 'pkce-challenge'

// Use import.meta.env for Vite env variables
const SPOTIFY_CLIENT_ID = import.meta.env.VITE_SPOTIFY_CLIENT_ID
const SPOTIFY_REDIRECT_URI = import.meta.env.VITE_REDIRECT_URI
const SPOTIFY_SCOPES = 'user-read-private user-read-email'

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [scanning, setScanning] = useState(false)
  const [qrResult, setQrResult] = useState<string | null>(null)
  const [showSuccess, setShowSuccess] = useState(false)

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
              window.history.replaceState({}, document.title, '/')
            }
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

  const handleSpotifyLogin = async () => {
    const { code_verifier, code_challenge } = await pkceChallenge()
    localStorage.setItem('spotify_code_verifier', code_verifier)
    const authUrl = `https://accounts.spotify.com/authorize?client_id=${SPOTIFY_CLIENT_ID}` +
      `&response_type=code` +
      `&redirect_uri=${encodeURIComponent(SPOTIFY_REDIRECT_URI)}` +
      `&scope=${encodeURIComponent(SPOTIFY_SCOPES)}` +
      `&code_challenge_method=S256` +
      `&code_challenge=${code_challenge}`
    window.location.href = authUrl
  }

  const startQrScan = async () => {
    setScanning(true)
    setQrResult(null)
    const qrRegionId = 'qr-region'
    const html5QrCode = new Html5Qrcode(qrRegionId)
    try {
      await html5QrCode.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: 250 },
        (decodedText) => {
          setQrResult(decodedText)
          setScanning(false)
          html5QrCode.stop()
          html5QrCode.clear()
          // Log QR code to console
          console.log('Scanned QR code:', decodedText)
        },
        () => {
          // Optionally handle scan errors
        }
      )
    } catch (err) {
      setScanning(false)
      alert('Failed to start QR scanner')
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
          <button onClick={startQrScan} disabled={scanning}>
            {scanning ? 'Scanning...' : 'Scan QR Code'}
          </button>
          <div
            id="qr-region"
            style={{
              width: 300,
              height: 300,
              margin: '20px auto',
              border: '1px solid #ccc',
              borderRadius: '8px',
              display: scanning ? 'block' : 'none',
            }}
          />
          {qrResult && <p>Last scanned QR: {qrResult}</p>}
        </>
      )}
    </div>
  )
}

export default App

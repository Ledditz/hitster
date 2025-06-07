import React, { useState } from 'react';
import { SpotifyApi } from '@spotify/web-api-ts-sdk';

interface PlayControlsProps {
  isLoggedIn: boolean;
  replayEnabled: boolean;
  spotifySdk: SpotifyApi | null;
  selectedDeviceId: string | null;
  setSelectedDeviceId: React.Dispatch<React.SetStateAction<string | null>>;
  setIsPlaying: React.Dispatch<React.SetStateAction<boolean>>;
  setLastPlayedTrack: React.Dispatch<any>;
  setReplayEnabled: React.Dispatch<React.SetStateAction<boolean>>;
  lastPlayedTrack: any;
  logOut: (setIsLoggedIn: React.Dispatch<React.SetStateAction<boolean>>, setSpotifySdk: React.Dispatch<React.SetStateAction<SpotifyApi | null>>) => void;
  setIsLoggedIn: React.Dispatch<React.SetStateAction<boolean>>;
  setSpotifySdk: React.Dispatch<React.SetStateAction<SpotifyApi | null>>;
}

export const PlayControls: React.FC<PlayControlsProps> = ({
  isLoggedIn,
  replayEnabled,
  spotifySdk,
  selectedDeviceId,
  setSelectedDeviceId,
  setIsPlaying,
  setLastPlayedTrack,
  setReplayEnabled,
  lastPlayedTrack,
  logOut,
  setIsLoggedIn,
  setSpotifySdk
}) => {

  const [devices, setDevices] = useState<any[]>([])
  // Set active device via API
  const handleTransferPlayback = async (deviceId: string) => {
    if (!spotifySdk) return;
    try {
      await spotifySdk.player.transferPlayback([deviceId], false);
      setSelectedDeviceId(deviceId);
      const devicesResponse = await spotifySdk.player.getAvailableDevices();
      setDevices(devicesResponse.devices);
    } catch (e) {
      alert('Failed to transfer playback to selected device.');
    }
  };

  // Play random song
  const handlePlayRandomSong = async () => {
    if (!spotifySdk) {
      alert('You must be logged in to Spotify!')
      logOut(setIsLoggedIn, setSpotifySdk);
      return
    }
    try {
      setIsPlaying(true);
      const playlists = await spotifySdk.currentUser.playlists.playlists()
      if (!playlists.items.length) {
        alert('No playlists found!')
        return
      }
      const randomPlaylist = playlists.items[Math.floor(Math.random() * playlists.items.length)]
      const tracks = await spotifySdk.playlists.getPlaylistItems(randomPlaylist.id)
      if (!tracks.items.length) {
        alert('No tracks found in the playlist!')
        return
      }
      const validTracks = tracks.items.map((item: any) => item.track).filter((track: any) => track && track.uri)
      if (!validTracks.length) {
        alert('No playable tracks found in the playlist!')
        return
      }
      const randomTrack = validTracks[Math.floor(Math.random() * validTracks.length)]
      setLastPlayedTrack(randomTrack)
      setReplayEnabled(true)
      const devicesResponse = await spotifySdk.player.getAvailableDevices()
      const activeDevice = devicesResponse.devices.find((d: any) => d.id === selectedDeviceId) || devicesResponse.devices.find((d: any) => d.is_active)
      if (!activeDevice) {
        alert('No active Spotify device found. Please open Spotify on one of your devices and start playing any song, then try again.')
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
            uris: [randomTrack.uri],
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

  // Fetch devices on mount and when spotifySdk changes
  React.useEffect(() => {
    const fetchDevices = async () => {
      if (!spotifySdk) return;
      try {
        const devicesResponse = await spotifySdk.player.getAvailableDevices();
        setDevices(devicesResponse.devices);
      } catch (e) {
        setDevices([]);
      }
    };
    fetchDevices();
  }, [spotifySdk]);

  return (
    <>
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
  );
};



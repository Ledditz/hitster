// Handles Spotify device and playback logic
import { SpotifyApi } from '@spotify/web-api-ts-sdk';

export async function fetchDevices(spotifySdk: SpotifyApi, setDevices: (d: any[]) => void, setSelectedDeviceId: (id: string | null) => void) {
  try {
    const devicesResponse = await spotifySdk.player.getAvailableDevices();
    setDevices(devicesResponse.devices);
    const active = devicesResponse.devices.find((d: any) => d.is_active);
    setSelectedDeviceId(active ? active.id : devicesResponse.devices[0]?.id || null);
  } catch (e) {
    setDevices([]);
  }
}

export async function transferPlayback(spotifySdk: SpotifyApi, deviceId: string, setSelectedDeviceId: (id: string) => void, setDevices: (d: any[]) => void) {
  try {
    await spotifySdk.player.transferPlayback([deviceId], false);
    setSelectedDeviceId(deviceId);
    const devicesResponse = await spotifySdk.player.getAvailableDevices();
    setDevices(devicesResponse.devices);
  } catch (e) {
    alert('Failed to transfer playback to selected device.');
  }
}

export async function playRandomSong(spotifySdk: SpotifyApi, selectedDeviceId: string | null, logOut: () => void) {
  try {
    const playlists = await spotifySdk.currentUser.playlists.playlists();
    if (!playlists.items.length) {
      alert('No playlists found!');
      return;
    }
    const randomPlaylist = playlists.items[Math.floor(Math.random() * playlists.items.length)];
    const tracks = await spotifySdk.playlists.getPlaylistItems(randomPlaylist.id);
    if (!tracks.items.length) {
      alert('No tracks found in the playlist!');
      return;
    }
    const validTracks = tracks.items.map((item: any) => item.track).filter((track: any) => track && track.uri);
    if (!validTracks.length) {
      alert('No playable tracks found in the playlist!');
      return;
    }
    const randomTrack = validTracks[Math.floor(Math.random() * validTracks.length)];
    const devicesResponse = await spotifySdk.player.getAvailableDevices();
    const activeDevice = devicesResponse.devices.find((d: any) => d.id === selectedDeviceId) || devicesResponse.devices.find((d: any) => d.is_active);
    if (!activeDevice) {
      alert('No active Spotify device found. Please open Spotify on one of your devices and start playing any song, then try again.');
      return;
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
    );
    setTimeout(async () => {
      try {
        await spotifySdk.player.pausePlayback(activeDevice.id || '');
      } catch (e) {
        console.error('Failed to pause playback:', e);
      }
    }, 10000);
    let trackName = (randomTrack as any).name;
    let artistNames = '';
    if ('artists' in randomTrack && Array.isArray((randomTrack as any).artists)) {
      artistNames = (randomTrack as any).artists.map((a: any) => a.name).join(', ');
    } else if ((randomTrack as any).show && typeof (randomTrack as any).show.name === 'string') {
      artistNames = (randomTrack as any).show.name;
    }
    alert(`Playing: ${trackName}${artistNames ? ' by ' + artistNames : ''}`);
  } catch (err: any) {
    console.error('Spotify playback error:', err);
    if (err && err.message) {
      alert('Failed to play a random song: ' + err.message + '\nMake sure you have Spotify Premium, an active device, and the correct permissions.');
    } else {
      alert('Failed to play a random song. Make sure you have Spotify Premium, an active device, and the correct permissions.');
    }
    logOut();
  }
}

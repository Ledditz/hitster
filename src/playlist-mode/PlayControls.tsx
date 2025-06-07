import React from 'react';
import { useSpotifyContext } from '../contexts/SongContext';
import { PlayButtons } from '../components/PlayButtons';

export const PlayControls: React.FC = () => {
  const {
    spotifySdk,
    setPlaying,
    setSongAndPlaying,
    selectedPlaylist,
  } = useSpotifyContext();
  const [replayEnabled, setReplayEnabled] = React.useState(false);
  const [lastPlayedTrack, setLastPlayedTrack] = React.useState<any | null>(null);

  // Store timeout id for canceling
  const playTimeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  // Pause playback on the active device
  const handlePause = async () => {
    if (!spotifySdk) return;
    try {
      const devicesResponse = await spotifySdk.player.getAvailableDevices();
      const activeDevice = devicesResponse.devices.find((d: any) => d.is_active);
      if (!activeDevice || !activeDevice.id) return;
      await spotifySdk.player.pausePlayback(activeDevice.id);
      if (playTimeoutRef.current) {
        clearTimeout(playTimeoutRef.current);
        playTimeoutRef.current = null;
      }
      setPlaying(false);
    } catch (e) {
      setPlaying(false);
    }
  };

  // Play random song from selected playlist
  const handlePlayRandomSong = async () => {
    if (!spotifySdk || !selectedPlaylist) return;
    setPlaying(true);
    try {
      const tracks = await spotifySdk.playlists.getPlaylistItems(selectedPlaylist.id);
      const validTracks = tracks.items.map((item: any) => item.track).filter((track: any) => track && track.uri);
      if (!validTracks.length) return;
      const randomTrack = validTracks[Math.floor(Math.random() * validTracks.length)];
      setLastPlayedTrack(randomTrack);
      setReplayEnabled(true);
      setSongAndPlaying({
        id: randomTrack.id,
        spotifyLink: `https://open.spotify.com/track/${randomTrack.id}`,
        artist: randomTrack.artists?.[0]?.name || '',
        title: randomTrack.name,
      }, true);
      const devicesResponse = await spotifySdk.player.getAvailableDevices();
      const activeDevice = devicesResponse.devices.find((d: any) => d.is_active);
      if (!activeDevice) return;
      await fetch(`https://api.spotify.com/v1/me/player/play?device_id=${activeDevice.id}`,
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
      if (playTimeoutRef.current) {
        clearTimeout(playTimeoutRef.current);
      }
      playTimeoutRef.current = setTimeout(async () => {
        try {
          if (activeDevice && activeDevice.id) {
            await spotifySdk.player.pausePlayback(activeDevice.id);
          }
        } catch (e) {}
        setPlaying(false);
        playTimeoutRef.current = null;
      }, 10000);
    } catch (e) {
      setPlaying(false);
    }
  };

  // Replay last played song
  const handleReplaySong = async () => {
    if (!spotifySdk || !lastPlayedTrack) return;
    setPlaying(true);
    try {
      const devicesResponse = await spotifySdk.player.getAvailableDevices();
      const activeDevice = devicesResponse.devices.find((d: any) => d.is_active);
      if (!activeDevice) return;
      await fetch(`https://api.spotify.com/v1/me/player/play?device_id=${activeDevice.id}`,
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
      );
      if (playTimeoutRef.current) {
        clearTimeout(playTimeoutRef.current);
      }
      playTimeoutRef.current = setTimeout(async () => {
        try {
          if (activeDevice && activeDevice.id) {
            await spotifySdk.player.pausePlayback(activeDevice.id);
          }
        } catch (e) {}
        setPlaying(false);
        playTimeoutRef.current = null;
      }, 10000);
    } catch (e) {
      setPlaying(false);
    }
  };

  return (
    <>
      <PlayButtons
        replayEnabled={replayEnabled}
        playSong={handlePlayRandomSong}
        replaySong={handleReplaySong}
        pauseSong={handlePause}
        showDeviceSelect={true}
      />
    </>
  );
};



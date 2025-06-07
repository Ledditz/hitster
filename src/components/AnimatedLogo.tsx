import React from 'react';
import { useSpotifyContext } from '../contexts/SongContext';

interface AnimatedLogoProps {
  // isPlaying: boolean;
}

export const AnimatedLogo: React.FC<AnimatedLogoProps> = ({  }) =>{
  const {isPlaying}=useSpotifyContext();
 return (
    <div className="flex flex-col items-center">
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
);
} 

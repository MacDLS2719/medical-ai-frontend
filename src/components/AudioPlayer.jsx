import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause } from 'lucide-react';

export default function AudioPlayer({ fileUrl, duration, isMe }) {
  const audioRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [audioDuration, setAudioDuration] = useState(duration || 0);

  useEffect(() => {
    if (duration && isFinite(duration) && duration > 0) {
      setAudioDuration(duration);
    }
  }, [duration]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    const handleTimeUpdate = () => setCurrentTime(audio.currentTime);
    const handleLoadedMetadata = () => {
      if (audio.duration && isFinite(audio.duration) && audio.duration > 0) {
        setAudioDuration(audio.duration);
      }
    };
    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };

    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('ended', handleEnded);
    };
  }, [fileUrl]);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play().catch((err) => console.error('Error reproduciendo audio:', err));
    }
  };

  const handleProgressChange = (e) => {
    if (!audioRef.current) return;
    const newTime = parseFloat(e.target.value);
    audioRef.current.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const formatTime = (seconds) => {
    if (!seconds || isNaN(seconds) || !isFinite(seconds) || seconds < 0) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return (
    <div className="flex items-center gap-3 py-1 min-w-[200px] md:min-w-[260px] font-sans">
      <audio ref={audioRef} src={fileUrl} preload="metadata" crossOrigin="anonymous" />

      <button
        type="button"
        onClick={togglePlay}
        className={`w-10 h-10 rounded-full flex items-center justify-center transition-all shadow-sm flex-shrink-0 cursor-pointer ${
          isMe
            ? 'bg-white text-blue-600 hover:scale-105 hover:bg-slate-50'
            : 'bg-teal-600 text-white hover:scale-105 hover:bg-teal-700'
        }`}
      >
        {isPlaying ? <Pause size={18} fill="currentColor" /> : <Play size={18} fill="currentColor" className="ml-0.5" />}
      </button>

      <div className="flex-1 flex flex-col gap-1 min-w-0">
        <input
          type="range"
          min="0"
          max={audioDuration || 100}
          value={currentTime}
          onChange={handleProgressChange}
          className={`w-full h-1.5 rounded-lg appearance-none cursor-pointer ${
            isMe ? 'bg-blue-400/50 accent-white' : 'bg-slate-200 accent-teal-600'
          }`}
          style={{
            background: isMe 
              ? `linear-gradient(to right, #ffffff 0%, #ffffff ${(currentTime / (audioDuration || 1)) * 100}%, rgba(255, 255, 255, 0.3) ${(currentTime / (audioDuration || 1)) * 100}%, rgba(255, 255, 255, 0.3) 100%)`
              : `linear-gradient(to right, #0d9488 0%, #0d9488 ${(currentTime / (audioDuration || 1)) * 100}%, #cbd5e1 ${(currentTime / (audioDuration || 1)) * 100}%, #cbd5e1 100%)`
          }}
        />
        <div className={`flex justify-between text-[10px] font-medium ${isMe ? 'text-blue-200' : 'text-slate-400'}`}>
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(audioDuration)}</span>
        </div>
      </div>
    </div>
  );
}
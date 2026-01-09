"use client"

import 
import { useState, useRef, useEffect } from "react"
import { Play, Pause, SkipBack, SkipForward, Volume2, VolumeX, Clock } from "lucide-react" interface AudioPlayerProps { src: string title?: string }

export
  function () {
  const audioRef = useRef<HTMLAudioElement>
    (
      isPlaying, setIsPlaying] = useState(false) const [currentTime, setCurrentTime] = useState(0) const [duration, setDuration] = useState(0) const [playbackRate, setPlaybackRate] = useState(1) const [volume, setVolume] = useState(1) const [isLoaded, setIsLoaded] = useState(false) useEffect(() => {
        const audio = audioRef.current if (!audio)
          return const handleTimeUpdate = () => setCurrentTime(audio.currentTime) const handleLoadedMetadata = () => { setDuration(audio.duration) setIsLoaded(true) }

        const handleEnded = () => setIsPlaying(false) const handleCanPlay = () => { if (audio.duration && !isNaN(audio.duration)) { setDuration(audio.duration) setIsLoaded(true) } } audio.addEventListener("timeupdate", handleTimeUpdate) audio.addEventListener("loadedmetadata", handleLoadedMetadata) audio.addEventListener("ended", handleEnded) audio.addEventListener("canplay", handleCanPlay) audio.addEventListener("durationchange", handleLoadedMetadata)
        return () => { audio.removeEventListener("timeupdate", handleTimeUpdate) audio.removeEventListener("loadedmetadata", handleLoadedMetadata) audio.removeEventListener("ended", handleEnded) audio.removeEventListener("canplay", handleCanPlay) audio.removeEventListener("durationchange", handleLoadedMetadata) }
      }, []) const togglePlayPause = () => {
        const audio = audioRef.current if (!audio)
          return if (isPlaying) { audio.pause() } else { audio.play() } setIsPlaying(!isPlaying)
      }

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const audio = audioRef.current if (!audio)
      return const newTime = Number.parseFloat(e.target.value) audio.currentTime = newTime setCurrentTime(newTime)
  }

  const handlePlaybackRateChange = () => {
    const audio = audioRef.current if (!audio)
      return const rates = [0.5, 0.75, 1, 1.25, 1.5, 2] const currentIndex = rates.indexOf(playbackRate) const nextIndex = (currentIndex + 1) % rates.length const newRate = rates[nextIndex] audio.playbackRate = newRate setPlaybackRate(newRate)
  }

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const audio = audioRef.current if (!audio)
      return const newVolume = Number.parseFloat(e.target.value) audio.volume = newVolume setVolume(newVolume)
  }

  const skip = (seconds: number) => {
    const audio = audioRef.current if (!audio)
      return audio.currentTime = Math.max(0, Math.min(duration, audio.currentTime + seconds))
  }

  const formatTime = (time: number) => {
    if (isNaN(time) || !isFinite(time))
      return "00:00" const hours = Math.floor(time / 3600) const minutes = Math.floor((time % 3600) / 60) const seconds = Math.floor(time % 60) if (hours > 0) {
        return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`
      }

    return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`
  }
  return (<div className="bg-primary/5 border border-primary/10 rounded-xl p-6">
    <audio ref={audioRef}
      src={src}
      preload="metadata" />
    <div className="flex items-center justify-between mb-4">
      {title && (<div className="flex items-center gap-2 text-sm text-text-muted">
        <Volume2 className="h-4 w-4 text-primary" />
        <span>
          {title}</span>
      </div>

      )} <div className="flex items-center gap-2 text-sm">
        <Clock className="h-4 w-4 text-primary" />
        <span className="font-medium text-foreground">
          {isLoaded ? formatTime(duration) : "جاري التحميل..."}</span>
      </div>

    </div>

    {/* Progress Bar */} <div className="mb-4">
      <input type="range" min={0}
        max={duration || 100}
        value={currentTime}
        onChange={handleSeek}
        className="w-full h-2 bg-border rounded-lg appearance-none cursor-pointer accent-primary" />
      <div className="flex justify-between text-xs text-text-muted mt-1">
        <span>
          {formatTime(currentTime)}</span>
        <span>
          {formatTime(duration)}</span>
      </div>

    </div>

    {/* Controls */} <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        {/* Skip Back */} <button onClick={() =>
          skip(-10)}
          className="w-10 h-10 flex items-center justify-center rounded-full bg-background hover:bg-primary hover:text-white transition-colors text-text-muted" title="تراجع 10 ثواني" > <SkipBack className="h-5 w-5" />
        </button>

        {/* Play/Pause */} <button onClick={togglePlayPause}
          className="w-14 h-14 flex items-center justify-center rounded-full bg-primary text-white hover:bg-primary-hover transition-colors shadow-lg" >
          {isPlaying ? <Pause className="h-7 w-7" />
            : <Play className="h-7 w-7 mr-[-2px]" />
          } </button>

        {/* Skip Forward */} <button onClick={() =>
          skip(10)}
          className="w-10 h-10 flex items-center justify-center rounded-full bg-background hover:bg-primary hover:text-white transition-colors text-text-muted" title="تقدم 10 ثواني" > <SkipForward className="h-5 w-5" />
        </button>
      </div>
      <div className="flex items-center gap-4">
        {/* Playback Speed */} <button onClick={handlePlaybackRateChange}
          className="px-3 py-1 rounded-lg bg-background text-sm font-medium text-text-muted hover:bg-primary hover:text-white transition-colors" title="سرعة التشغيل" >
          {playbackRate}x </button>

        {/* Volume */} <div className="flex items-center gap-2">
          {volume === 0 ? (<VolumeX className="h-5 w-5 text-text-muted" />
          ) : (<Volume2 className="h-5 w-5 text-text-muted" />
          )} <input type="range" min={0}
            max={1}
            step={0.1}
            value={volume}
            onChange={handleVolumeChange}
            className="w-20 h-1 bg-border rounded-lg appearance-none cursor-pointer accent-primary" />
        </div>
      </div>
    </div>
  </div>

  )
}



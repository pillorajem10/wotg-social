import React, { useEffect, useRef, useState } from 'react';
import styles from './index.module.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPause, faPlay, faVolumeUp, faStepForward, faStepBackward } from '@fortawesome/free-solid-svg-icons';
import { useDispatch, useSelector } from 'react-redux';
import * as types from '../../redux/wotgsocial/types';
import { useLocation } from 'react-router-dom';

const backendUrlImage = 'https://wotg.sgp1.cdn.digitaloceanspaces.com/images';
const backendUrlAudio = 'https://wotg.sgp1.cdn.digitaloceanspaces.com/audios';

const MusicControlsSection = () => {
  const dispatch = useDispatch();
  const audioRef = useRef(null);
  const location = useLocation();

  const { currentTrack, isPlaying, volume } = useSelector((state) => state.wotgsocial.musicPlayer);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);

  const isMusicRoute = location.pathname === '/music';
  const isAlbumRoute = /^\/album\/\d+$/.test(location.pathname);
  const isPlaylistRoute = /^\/playlist\/\d+$/.test(location.pathname);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !currentTrack) return;
  
    // Reset and play new audio
    audio.pause();
    audio.src = `${backendUrlAudio}/${currentTrack.audio_url}`;
    audio.load();
  
    let rafId;
  
    const onLoaded = () => {
      audio.currentTime = 0;
      setDuration(audio.duration || 0);
      setCurrentTime(0);
  
      audio.play().then(() => {
        dispatch({ type: types.SET_IS_PLAYING, payload: true });
  
        // Set initial MediaSession state
        if ('mediaSession' in navigator) {
          navigator.mediaSession.metadata = new window.MediaMetadata({
            title: currentTrack.title,
            artist: currentTrack.artist_name,
            album: 'WOTG Streaming',
            artwork: [
              {
                src: `${backendUrlImage}/${currentTrack.cover_image || 'default-cover.png'}`,
                sizes: '512x512',
                type: 'image/png'
              }
            ]
          });
  
          // Initial state
          if ('setPositionState' in navigator.mediaSession) {
            navigator.mediaSession.setPositionState({
              duration: audio.duration || 0,
              playbackRate: 1.0,
              position: 0
            });
          }
  
          // Lock screen media handlers
          navigator.mediaSession.setActionHandler('play', () => {
            audio.play().then(() => {
              dispatch({ type: types.SET_IS_PLAYING, payload: true });
            });
          });
  
          navigator.mediaSession.setActionHandler('pause', () => {
            audio.pause();
            dispatch({ type: types.SET_IS_PLAYING, payload: false });
          });
  
          navigator.mediaSession.setActionHandler('previoustrack', () => {
            dispatch({ type: types.PLAY_PREVIOUS_TRACK });
          });
  
          navigator.mediaSession.setActionHandler('nexttrack', () => {
            dispatch({ type: types.PLAY_NEXT_TRACK });
          });
        }
  
        // Start updating lock screen slider
        const updateSlider = () => {
          setCurrentTime(audio.currentTime);
          if ('setPositionState' in navigator.mediaSession) {
            navigator.mediaSession.setPositionState({
              duration: audio.duration || 0,
              playbackRate: 1.0,
              position: audio.currentTime
            });
          }
          rafId = requestAnimationFrame(updateSlider);
        };
  
        updateSlider();
      });
    };
  
    const onEnded = () => {
      dispatch({ type: types.PLAY_NEXT_TRACK });
    };
  
    audio.addEventListener('loadedmetadata', onLoaded);
    audio.addEventListener('ended', onEnded);
  
    return () => {
      audio.removeEventListener('loadedmetadata', onLoaded);
      audio.removeEventListener('ended', onEnded);
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, [currentTrack, dispatch]);  

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (isPlaying) {
      audio.pause();
      dispatch({ type: types.SET_IS_PLAYING, payload: false });
    } else {
      audio.play().then(() => dispatch({ type: types.SET_IS_PLAYING, payload: true }));
    }
  };

  const handleSliderChange = (e) => {
    const audio = audioRef.current;
    if (audio) {
      const value = parseFloat(e.target.value);
      audio.currentTime = value;
      setCurrentTime(value);
    }
  };

  const handleVolumeChange = (e) => {
    const value = parseFloat(e.target.value);
    if (audioRef.current) {
      audioRef.current.volume = value;
    }
    dispatch({ type: types.SET_VOLUME, payload: value });
  };

  if (!currentTrack) return null;

  // console.log('CURRENT TRACKKK', currentTrack);

  return (
    <div
      className={styles.musicControlsSection}
      style={{
        display: isMusicRoute || isAlbumRoute || isPlaylistRoute ? 'flex' : 'none',
      }}
    >
      <div className={styles.songInfo} onClick={togglePlay}>
        <img
          src={`${backendUrlImage}/${currentTrack.cover_image || 'default-cover.png'}`}
          alt={currentTrack.title}
          className={styles.albumThumb}
        />
        <div>
          <p className={styles.songTitle}>{currentTrack.title}</p>
          <p className={styles.songArtist}>{currentTrack.artist_name}</p>
        </div>
      </div>

      <div className={styles.controls}>
        <div className={styles.icons}>
          <FontAwesomeIcon icon={faStepBackward} className={styles.icon} onClick={() => dispatch({ type: types.PLAY_PREVIOUS_TRACK })} />
          <FontAwesomeIcon icon={isPlaying ? faPause : faPlay} className={styles.icon} onClick={togglePlay} />
          <FontAwesomeIcon icon={faStepForward} className={styles.icon} onClick={() => dispatch({ type: types.PLAY_NEXT_TRACK })} />
        </div>

        <div className={styles.progress}>
          <span className={styles.time}>{formatTime(currentTime)}</span>
          <input
            type="range"
            className={styles.slider}
            min="0"
            max={duration}
            step="0.1"
            value={currentTime}
            onChange={handleSliderChange}
          />
          <span className={styles.time}>{formatTime(duration)}</span>
        </div>
      </div>

      <div className={styles.volume}>
        <FontAwesomeIcon icon={faVolumeUp} className={styles.icon} />
        <input
          type="range"
          className={styles.volumeSlider}
          min="0"
          max="1"
          step="0.01"
          value={volume}
          onChange={handleVolumeChange}
        />
      </div>

      <audio ref={audioRef} preload="metadata" />
    </div>
  );
};

const formatTime = (s) => {
  const mins = Math.floor(s / 60);
  const secs = Math.floor(s % 60).toString().padStart(2, '0');
  return `${mins}:${secs}`;
};

export default React.memo(MusicControlsSection);

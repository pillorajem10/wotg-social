// react
import React, { useState, useCallback, useEffect, useMemo, useRef } from 'react';

// redux
import { wotgsocial } from '../../redux/combineActions';
import { useDispatch } from 'react-redux';

// css
import styles from './index.module.css';

// components
import LoadingSpinner from '../../components/LoadingSpinner';

const RecommendedTracksSection = ({
  playlistId,
  onRefresh
}) => {
  const dispatch = useDispatch();
  
  const loadingRef = useRef(null);

  const backendUrl = useMemo(
    () => 'https://wotg.sgp1.cdn.digitaloceanspaces.com/images',
    []
  );

  const [loading, setLoading] = useState(false);
  const [recommendedMusics, setRecommendedMusics] = useState([]);

  const handleFetchRecommended = useCallback(async () => {
    if (loadingRef.current) return;
    loadingRef.current = true;
    setLoading(true);

    try {
      const res = await dispatch(
        wotgsocial.music.getRecoByParamsAction({
          pageIndex: 1,
          pageSize: 10
        })
      );

      if (res.success) {
        setRecommendedMusics(res.data.musics);
      }
    } catch (err) {
      console.error('Unable to retrieve recommended tracks:', err);
    } finally {
      loadingRef.current = false;
      setLoading(false);
    }
  }, [dispatch, onRefresh]);

  useEffect(() => {
    handleFetchRecommended();
  }, [handleFetchRecommended]);

  const handleAddTrackToPlayList = useCallback(async (trackId) => {
    if (loadingRef.current) return;
    loadingRef.current = true;
    setLoading(true);

    const payload = {
      playlistId,
      musicIds: [ trackId ]
    }

    try {
      await dispatch(wotgsocial.playlist.addMusicToPlaylistAction(payload));
      onRefresh();
    } catch (err) {
      console.error('Unable to add track to playlist');
    } finally {
      loadingRef.current = false;
      setLoading(false);
    }
  }, [dispatch])

  const handleTrackClick = (trackId, coverImage) => {
    dispatch(wotgsocial.musicPlayer.setTrackList(recommendedMusics));
    const meta = { source: "album", albumCover: coverImage };
    const selected = recommendedMusics.find((t) => t.id === trackId);
    dispatch(wotgsocial.musicPlayer.setCurrentTrack({ ...selected, ...meta }));
    dispatch(wotgsocial.musicPlayer.setIsPlaying(true));
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className={styles.recommendedSection}>
        <div className={styles.recommendedHeading}>
          <h4 className={styles.recommendedTitle}>Recommended</h4>
          <button onClick={handleFetchRecommended} className={styles.refreshButton}>Refresh</button>
        </div>
        {/*<p className={styles.subText}>Based on what’s in this playlist</p>*/}

        <div className={styles.recommendedList}>
            {recommendedMusics.map((music, index) => (
              <div key={index} onClick={() => handleTrackClick(music.id, music.cover_image)} className={styles.recommendedRow}>
                  <img
                      src={`${backendUrl}/${music.cover_image || 'https://wotg.sgp1.cdn.digitaloceanspaces.com/images/wotgLogo.webp'}`}
                      alt={music.title}
                      className={styles.musicThumbnail}
                  />
                  <div className={styles.musicDetails}>
                      <p className={styles.musicTitle}>{music.title}</p>
                      <p className={styles.musicArtist}>{music.artist_name}</p>
                  </div>
                  <button
                    className={styles.addButton}
                    onClick={(e) => {
                      e.stopPropagation(); // ⛔ Prevents bubbling to the parent div
                      handleAddTrackToPlayList(music.id);
                    }}
                  >
                    Add
                  </button>
              </div>
            ))}
        </div>
    </div>
  );
};

export default React.memo(RecommendedTracksSection);

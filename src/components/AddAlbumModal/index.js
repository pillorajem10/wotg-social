import React, { useState, useCallback, useMemo, useRef } from "react";
import styles from "./index.module.css";

import { useDispatch } from "react-redux";
import { wotgsocial } from "../../redux/combineActions";

import LoadingSpinner from "../../components/LoadingSpinner";

const AddAlbumModal = ({ isOpen, onClose }) => {
  const initialForm = useMemo(
    () => ({
      title: "",
      type: "album",
      // release_date: "",
      file: null, // ✅ Image file
    }),
    []
  );

  const dispatch = useDispatch();
  const loadingRef = useRef(false); // ✅ Loading state reference
  const today = new Date();
  const dateTodayString = today.toLocaleDateString();

  const [formData, setFormData] = useState(initialForm);
  const [loading, setLoading] = useState(false); // ✅ Loading state
  const [imagePreview, setImagePreview] = useState(null); // ✅ Preview URL

  const handleChange = useCallback((e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  }, []);

  const handleFileChange = useCallback((e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData((prev) => ({ ...prev, file }));
      setImagePreview(URL.createObjectURL(file)); // ✅ Create preview
    }
  }, []);

  const handleSubmit = useCallback(
    async (e) => {
      e.preventDefault();

      if (loadingRef.current) return; // ✅ Prevent multiple submissions
      loadingRef.current = true; // ✅ Set loading state
      setLoading(true); // ✅ Set loading state

      const payload = {
        title: formData.title,
        type: formData.type,
        release_date: dateTodayString,
        file: formData.file,
      };

      try {
        const res = await dispatch(wotgsocial.album.createAlbumAction(payload));
        if (res.success) {
          onClose();
          setFormData(initialForm);
          setImagePreview(null);
        } else {
          console.error("Error adding album:", res.error);
        }
      } catch (error) {
        console.error("Error adding album:", error);
      } finally {
        loadingRef.current = false; // ✅ Reset loading state
        setLoading(false); // ✅ Reset loading state
      }
    },
    [dispatch, formData, initialForm, onClose]
  );

  if (!isOpen) return null;

  return (
    <>
      { loading ? <LoadingSpinner /> : (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <h2>Add Album</h2>
            <form onSubmit={handleSubmit} className={styles.form}>
              <input
                type="text"
                name="title"
                placeholder="Album Title"
                value={formData.title}
                onChange={handleChange}
                required
              />

              <label className={styles.fileLabel}>
                Upload Cover Image
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className={styles.fileInput}
                />
              </label>

              {imagePreview && (
                <div className={styles.previewContainer}>
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className={styles.imagePreview}
                  />
                </div>
              )}

              <div className={styles.actions}>
                <button type="button" onClick={onClose} className={styles.cancel}>
                  Cancel
                </button>
                <button type="submit" className={styles.submit}>
                  Add Album
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>

  );
};

export default React.memo(AddAlbumModal);

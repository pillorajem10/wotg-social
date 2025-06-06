import React, { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useDispatch } from "react-redux";
import { useParams } from "react-router-dom";
import { wotgsocial } from "../../redux/combineActions";

import LoadingSpinner from "../../components/LoadingSpinner";
import DynamicSnackbar from "../../components/DynamicSnackbar";

import RecordingPreview from "../../sections/RecordingPreview";
import RecordingSection from "../../sections/RecordingSection";
import ScriptEditor from "../../sections/ScriptEditor";
import TeleprompterPreview from "../../sections/TeleprompterPreview";

import { useSetHideNavbar } from "../../contexts/NavbarContext";

import styles from "./index.module.css";

const Page = () => {
    const dispatch = useDispatch();
    const { id } = useParams();
    const loadingRef = useRef(false);

    const [blog, setBlog] = useState(null);
    const [loading, setLoading] = useState(true);
    const [step, setStep] = useState(0);
    const [scriptText, setScriptText] = useState("");
    const [recordedVideo, setRecordedVideo] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [snackbar, setSnackbar] = useState({ open: false, message: "", type: "success" });

    const setHideNavbar = useSetHideNavbar();

    // ✅ Generate a unique draft key for each blog
    const draftKey = useMemo(() => `draft_script_${id}`, [id]);

    // ✅ Load script draft from localStorage (Runs only on mount or id change)
    useEffect(() => {
        const savedDraft = localStorage.getItem(draftKey);
        if (savedDraft) {
            setScriptText(savedDraft);
        }
    }, [draftKey]);

    useEffect(() => {
        if (step === 1 || step === 2) {
          setHideNavbar(true);
        } else {
          setHideNavbar(false);
        }
      
        // Optional cleanup to reset on unmount
        return () => setHideNavbar(false);
    }, [step, setHideNavbar]);

    // ✅ Save draft when user types (Optimized with `useCallback`)
    const handleScriptChange = useCallback((newText) => {
        setScriptText((prevText) => {
            if (prevText !== newText) {
                localStorage.setItem(draftKey, newText); // Save draft only if text has changed
                return newText;
            }
            return prevText;
        });
    }, [draftKey]);

    // ✅ Ensure draft is **NOT** deleted when pressing "Next"
    const handleNext = useCallback(() => {
        setStep((prevStep) => prevStep + 1);
    }, []);

    // ✅ Remove draft **ONLY AFTER** video upload completes
    const handleSaveVideo = useCallback(async () => {
        if (!recordedVideo || !id) return;
    
        setUploading(true);
        setLoading(true);
    
        const payload = { id, file: recordedVideo };
    
        try {
            const res = await dispatch(wotgsocial.blog.uploadBlogVideoAction(payload));
    
            if (res?.success) {
                setStep(0);
                // localStorage.removeItem(draftKey); // ✅ Remove draft only after successful upload
                setSnackbar({ open: true, message: "Video received. Please wait for processing...", type: "success" });
            } else {
                setSnackbar({ open: true, message: res?.message || "Upload failed. Please try again.", type: "error" });
            }
        } catch (error) {
            setSnackbar({ open: true, message: "Upload failed. Please try again.", type: "error" });
        } finally {
            setUploading(false);
            setLoading(false);
        }
    }, [dispatch, id, recordedVideo, draftKey]);    

    // ✅ Initialize teleprompter settings (Memoized to prevent unnecessary re-renders)
    const [teleprompterSettings, setTeleprompterSettings] = useState(() => ({
        fontSize: parseFloat(localStorage.getItem("teleprompter_fontSize")) || 16,
        scrollSpeed: parseFloat(localStorage.getItem("teleprompter_scrollSpeed")) || 2,
        paddingX: parseFloat(localStorage.getItem("teleprompter_paddingX")) || 10,
    }));

    // ✅ Remove All <img> Tags from HTML String (Optimized)
    const removeImagesFromHTML = useCallback((htmlString) => {
        if (!htmlString) return "";
        const parser = new DOMParser();
        const doc = parser.parseFromString(htmlString, "text/html");
        doc.querySelectorAll("img").forEach((img) => img.remove());
        return doc.body.innerHTML;
    }, []);

    // ✅ Fetch Blog Details (Preventing Duplicate API Calls)
    const fetchBlogDetails = useCallback(async () => {
        if (!id || loadingRef.current) return;
        loadingRef.current = true;
        setLoading(true);

        try {
            const res = await dispatch(wotgsocial.blog.getBlogByIdAction(id));
            if (res.success) {
                setBlog(res.data);

                // ✅ Convert HTML to plain text
                const cleanedHtml = removeImagesFromHTML(res.data.blog_body);
                const plainText = new DOMParser().parseFromString(cleanedHtml, "text/html").body.textContent;

                // ✅ Only update if no draft exists
                if (!localStorage.getItem(draftKey)) {
                    setScriptText(plainText);
                }
            }
        } catch (error) {
            setSnackbar({ open: true, message: "Failed to fetch blog details.", type: "error" });
        } finally {
            setLoading(false);
            loadingRef.current = false;
        }
    }, [dispatch, id, removeImagesFromHTML, draftKey]);

    useEffect(() => {
        fetchBlogDetails();
    }, [fetchBlogDetails]);

    return (
        <>
            {loading ? (
                <LoadingSpinner />
            ) : (
                <div className={styles.mainContainer}>
                    {/*step !== 2 && step !== 1 && (
                        <div className={styles.navbar}>
                            <div className={styles.logo}>
                                <img src={wotgLogo} alt="WOTG Logo"/>
                            </div>

                            <div className={styles.navLinks}>
                                <a href="/" className={styles.navLink}>Chat</a>
                                <a href="/worship" className={styles.navLink}>Worship</a>
                                <a href="https://wotgonline.com/donate/" target="_blank" rel="noopener noreferrer" className={styles.navLink}>Give</a>
                            </div>
                        </div>
                    )*/}

                    <div className={styles.blogContainer}>
                        {blog ? (
                            <div className={styles.contentWrapper}>
                                {step === 0 && (
                                    <ScriptEditor
                                        scriptText={scriptText}
                                        setScriptText={handleScriptChange}
                                        onNext={handleNext}
                                    />
                                )}
                                {step === 1 && (
                                    <TeleprompterPreview
                                        scriptText={scriptText}
                                        teleprompterSettings={teleprompterSettings}
                                        setTeleprompterSettings={setTeleprompterSettings}
                                        onPrev={() => setStep(0)}
                                        onNext={() => setStep(2)}
                                    />
                                )}
                                {step === 2 && (
                                    <RecordingSection
                                        scriptText={scriptText}
                                        teleprompterSettings={teleprompterSettings}
                                        setRecordedVideo={setRecordedVideo}
                                        onPrev={() => setStep(1)}
                                        onNext={() => setStep(3)}
                                    />
                                )}
                                {step === 3 && (
                                    <RecordingPreview
                                        recordedVideo={recordedVideo}
                                        onSave={handleSaveVideo}
                                        onReRecord={() => {
                                            setRecordedVideo(null);
                                            setStep(2);
                                        }}
                                        blogId={id}
                                    />
                                )}
                            </div>
                        ) : (
                            <p className={styles.noBlog}>Blog not found.</p>
                        )}
                    </div>

                    {uploading && (
                        <div className={styles.uploadingOverlay}>
                            <p>Uploading video...</p>
                        </div>
                    )}
                </div>
            )}

            <DynamicSnackbar
                open={snackbar.open}
                message={snackbar.message}
                type={snackbar.type}
                onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))} 
            />
        </>
    );
};

export default Page;

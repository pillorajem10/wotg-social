import React, { useState, useEffect, useCallback } from "react";
import { useDispatch } from "react-redux";
import { useParams } from "react-router-dom";
import parse from "html-react-parser";
import { wotgsocial } from "../../redux/combineActions";
import wotgLogo from "./wotg-logo.png";

import LoadingSpinner from "../../components/LoadingSpinner";

import RecordingPreview from "../../sections/RecordingPreview";
import RecordingSection from "../../sections/RecordingSection";
import ScriptEditor from "../../sections/ScriptEditor";
import TeleprompterPreview from "../../sections/TeleprompterPreview";

import styles from "./index.module.css";

const Page = () => {
    const dispatch = useDispatch();
    const { id } = useParams();
    const [blog, setBlog] = useState(null);
    const [loading, setLoading] = useState(true);
    const [step, setStep] = useState(0);
    const [scriptText, setScriptText] = useState("");
    const [recordedVideo, setRecordedVideo] = useState(null); // ✅ Store recorded video
    const [fontSize, setFontSize] = useState(16);
    const [scrollSpeed, setScrollSpeed] = useState(2);
    const [uploading, setUploading] = useState(false); // ✅ Track upload status

    // ✅ Function to remove all <img> elements from HTML string
    const removeImagesFromHTML = useCallback((htmlString) => {
        if (!htmlString) return "";

        const parser = new DOMParser();
        const doc = parser.parseFromString(htmlString, "text/html");
        doc.querySelectorAll("img").forEach((img) => img.remove());
        return doc.body.innerHTML;
    }, []);

    // ✅ Fetch Blog Details
    const fetchBlogDetails = useCallback(() => {
        setLoading(true);
        dispatch(wotgsocial.blog.getBlogByIdAction(id))
            .then((res) => {
                if (res.success) {
                    setBlog(res.data);

                    // ✅ Convert HTML to plain text
                    const cleanedHtml = removeImagesFromHTML(res.data.blog_body);
                    const plainText = new DOMParser().parseFromString(cleanedHtml, "text/html").body.textContent;

                    setScriptText(plainText);
                }
            })
            .finally(() => setLoading(false));
    }, [dispatch, id, removeImagesFromHTML]);

    useEffect(() => {
        if (id) {
            fetchBlogDetails();
        }
    }, [fetchBlogDetails, id]);

    // ✅ Handle Video Upload
    const handleSaveVideo = async () => {
        if (!recordedVideo) return;
        
        setUploading(true);
        try {
            await dispatch(wotgsocial.blog.uploadBlogVideoAction(recordedVideo));
            setStep(0); // ✅ Go back to the first step after successful upload
        } catch (error) {
            console.error("Upload failed:", error);
        } finally {
            setUploading(false);
        }
    };

    return (
        <>
            {loading ? <LoadingSpinner /> : (
                <div className={styles.mainContainer}>
                    {step !== 2 && step !== 1 && (
                        <div className={styles.navbar}>
                            <div className={styles.logo}>
                                <img src={wotgLogo} alt="WOTG Logo" />
                            </div>

                            <div className={styles.navLinks}>
                                <a href="/" className={styles.navLink}>Chat</a>
                                <a href="/worship" className={styles.navLink}>Worship</a>
                                <a href="https://wotgonline.com/donate/" target="_blank" rel="noopener noreferrer" className={styles.navLink}>Give</a>
                            </div>
                        </div>
                    )}

                    <div className={styles.blogContainer}>
                        {blog ? (
                            <div>
                                {step === 0 && (
                                    <ScriptEditor
                                        scriptText={scriptText}
                                        setScriptText={setScriptText}
                                        onNext={() => setStep(1)}
                                    />
                                )}
                                {step === 1 && (
                                    <TeleprompterPreview
                                        scriptText={scriptText}
                                        fontSize={fontSize}
                                        setFontSize={setFontSize}
                                        scrollSpeed={scrollSpeed}
                                        setScrollSpeed={setScrollSpeed}
                                        onPrev={() => setStep(0)}
                                        onNext={() => setStep(2)}
                                    />
                                )}
                                {step === 2 && (
                                    <RecordingSection
                                        scriptText={scriptText}
                                        fontSize={fontSize}
                                        scrollSpeed={scrollSpeed}
                                        setRecordedVideo={setRecordedVideo} // ✅ Pass function to update recordedVideo
                                        onPrev={() => setStep(1)}
                                        onNext={() => setStep(3)}
                                    />
                                )}
                                {step === 3 && (
                                    <RecordingPreview
                                        recordedVideo={recordedVideo} // ✅ Pass recorded video to preview
                                        onSave={handleSaveVideo}
                                        onReRecord={() => {
                                            setRecordedVideo(null); // ✅ Reset video if user discards
                                            setStep(2); // ✅ Go back to Step 3 (Recording)
                                        }}
                                    />
                                )}
                            </div>
                        ) : (
                            <p className={styles.noBlog}>Blog not found.</p>
                        )}
                    </div>

                    {/* ✅ Show Uploading Indicator */}
                    {uploading && (
                        <div className={styles.uploadingOverlay}>
                            <p>Uploading video...</p>
                        </div>
                    )}
                </div>
            )}
        </>
    );
};

export default Page;

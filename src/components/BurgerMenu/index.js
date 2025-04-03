import { useEffect, memo } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import styles from "./index.module.css";

const BurgerMenu = ({ onClose }) => {
  // Prevent background scroll when menu is open
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "auto";
    };
  }, []);

  return (
    <motion.div
      className={styles.burgerMenuOverlay}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3, ease: "easeInOut" }}
    >
      <button className={styles.closeButton} onClick={onClose}>
        &times;
      </button>

      <nav className={styles.menuNav}>
        <Link to="/" className={styles.menuItem} onClick={onClose}>Chat</Link>
        <Link to="/blogs" className={styles.menuItem} onClick={onClose}>Devotion</Link>
        <Link to="/bible" className={styles.menuItem} onClick={onClose}>Bible</Link>
        <Link to="/your-journals" className={styles.menuItem} onClick={onClose}>Journals</Link>
        <Link to="/worship" className={styles.menuItem} onClick={onClose}>Worship</Link>
        <a
          href="https://wotgonline.com/donate/"
          target="_blank"
          rel="noopener noreferrer"
          className={styles.menuItem}
          onClick={onClose}
        >
          Give
        </a>
      </nav>
    </motion.div>
  );
};

// ✅ Memoize with custom comparison to avoid re-renders
export default memo(BurgerMenu, (prevProps, nextProps) => {
  return prevProps.onClose === nextProps.onClose;
});
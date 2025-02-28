import React, { useState, useEffect, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { io } from 'socket.io-client';
import { wotgsocial, common } from '../../redux/combineActions';
import Cookies from 'js-cookie';
import styles from './index.module.css';
import ChatWindowStream from '../../components/ChatWindowStream';
import wotgLogo from './wotgLogo.jpg';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEye } from '@fortawesome/free-solid-svg-icons';

const Page = () => {
  const dispatch = useDispatch();

  // Global state
  const { ui: { loading } } = useSelector((state) => state.common);

  let wotglivechatroom = process.env.NODE_ENV === 'development' ? 40 : 7;
  const userRole = Cookies.get('role');

  // Local state
  const [messages, setMessages] = useState([]);
  const [chatrooms, setChatrooms] = useState([]);
  const [selectedChatroomDetails, setSelectedChatroomDetails] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [socket, setSocket] = useState(null);
  const [user, setUser] = useState(null);
  const [videoId, setVideoId] = useState(''); // YouTube video ID
  const [newVideoId, setNewVideoId] = useState('');
  const [viewersCount, setViewersCount] = useState(1);
  const [viewersList, setViewersList] = useState([]); 
  const [isModalOpen, setIsModalOpen] = useState(false); // Modal state
  const [reactions, setReactions] = useState([]);
  // const [messageReacts, setMessageReacts] = useState([]);
  
  // Fetch user authentication details
  useEffect(() => {
    const account = Cookies.get('account') ? JSON.parse(Cookies.get('account')) : null;
    const authenticated = Cookies.get('authenticated') === 'true';

    if (account && authenticated) {
      setUser(account);
      setIsAuthenticated(true);
    } else {
      setIsAuthenticated(false);
    }
  }, []);

  // Initialize Socket.IO
  useEffect(() => {
    if (!isAuthenticated) return;

    const socketUrl = process.env.NODE_ENV === 'development' 
      ? 'http://localhost:5000' 
      : 'https://community.wotgonline.com';

    const newSocket = io(socketUrl, { transports: ['websocket'] });
    setSocket(newSocket);

    return () => newSocket.disconnect();
  }, [isAuthenticated]);

  const handleUpdateWorship = async () => {
    if (!newVideoId) return;

    dispatch(common.ui.setLoading());
    const res = await dispatch(wotgsocial.worship.createWorshipServiceAction(newVideoId));

    dispatch(common.ui.clearLoading());
    if (res.success) {
      setVideoId(newVideoId);
      setNewVideoId('');
    }
  };

  const openViewersListModal = () => setIsModalOpen(true);
  const closeViewersListModal = () => setIsModalOpen(false);

  // Fetch Messages
  const fetchMessages = useCallback(async (chatroomId) => {
    if (!chatroomId || !isAuthenticated) return;

    dispatch(common.ui.setLoading());
    const res = await dispatch(wotgsocial.message.getMessagesByChatroomAction(chatroomId));

    dispatch(common.ui.clearLoading());
    if (res.success) {
      setMessages(res.data.messages);
      setSelectedChatroomDetails(res.data.chatroom);
    }
  }, [dispatch, isAuthenticated]);

  useEffect(() => {
    if (isAuthenticated) {
      dispatch(wotgsocial.worship.getWorshipServiceAction()).then((res) => {
        if (res.success) {
          setVideoId(res.data.videoId); // Store video ID dynamically
        }
      });
    }
  }, [dispatch, isAuthenticated]);
  

  // Fetch messages when chatroom changes
  useEffect(() => {
    if (isAuthenticated) {
      fetchMessages(wotglivechatroom);
    }
  }, [fetchMessages, isAuthenticated]);

  // Handle sending a message
  const handleSendMessage = (messageContent) => {
    if (!user) return;

    const message = {
      content: messageContent,
      senderId: user.id,
      chatroomId: wotglivechatroom,
    };

    socket.emit('send_message', message);
    dispatch(wotgsocial.message.sendMessageAction(message));
  };

  const handleReactMessage = (messageId, reactionType) => {
    if (!socket) {
      console.error("⚠️ Socket is not connected! Cannot send reaction.");
      return;
    }
  
    socket.emit("send_message_reaction", { messageId, react: reactionType });
    dispatch(wotgsocial.message.reactToMessageAction({ messageId, react: reactionType }));
  };
  
  const sendReaction = (reaction) => {
      if (!socket) {
          console.error("⚠️ Socket is not connected! Cannot send reaction.");
          return;
      }

      socket.emit("send_reaction", reaction);
  };

  // Listen for real-time reactions from the server
  useEffect(() => {
      if (!socket) return;

      socket.on("new_reaction", (reaction) => {
          setReactions((prev) => [...prev, { id: Date.now(), type: reaction }]);

          // Remove reaction after animation
          setTimeout(() => {
              setReactions((prev) => prev.slice(1));
          }, 3000);
      });

      return () => socket.off("new_reaction");
  }, [socket]);

  // Real-time message updates
  useEffect(() => {
    if (!socket) return;

    socket.on('new_message', (message) => {
      // Update only if the message belongs to the current chatroom
      if (message.chatroomId === wotglivechatroom) {
        setMessages((prevMessages) => {
            const isDuplicate = prevMessages.some((msg) => msg.id === message.id);
            if (isDuplicate) return prevMessages;

            const updatedMessages = [message, ...prevMessages];
            // Sort messages in descending order based on createdAt timestamp
            updatedMessages.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
            return updatedMessages;
        });
      }
    });

    return () => socket.off('new_message');
  }, [socket]);

  // Join and leave chatrooms dynamically
  useEffect(() => {
    if (!socket) return;

    chatrooms.forEach((chatroom) => {
      socket.emit('join_room', chatroom.id);
    });

    socket.emit('join_room', wotglivechatroom);

    return () => {
      socket.emit('leave_room', wotglivechatroom);
    };
  }, [socket]);

  useEffect(() => {
    if (!socket || !user) return;

    // Notify server that this user joined the worship page
    socket.emit("join_worship", {
      email: user.email,
      user_fname: user.user_fname,
      user_lname: user.user_lname
    });

    // Listen for viewer count and list updates
    socket.on("update_viewers", ({ count, viewers }) => {
      setViewersCount(count);
      setViewersList(viewers);
    });

    // Cleanup: Notify server when user leaves
    return () => {
      socket.emit("leave_worship", { email: user.email });
      socket.off("update_viewers");
    };
  }, [socket, user]);
  
  useEffect(() => {
    if (!socket) return;
  
    socket.on("new_message_reaction", (newReaction) => {
      setMessages((prevMessages) =>
        prevMessages.map((msg) =>
          msg.id === newReaction.messageId
            ? { ...msg, reactions: [...(msg.reactions || []), newReaction] } // ✅ Ensure reactions is always an array
            : msg
        )
      );
    });
  
    return () => socket.off("new_message_reaction");
  }, [socket]);   

  return (
    <div className={styles.container}>
      {/* Right Column */}
      <div className={styles.rightColumn}>

        {/* Navbar at the Top */}
        <div className={styles.navbar}>
          {/* Logo on the Left */}
          <div className={styles.logo}>
            <img src={wotgLogo} alt="WOTG Logo"/>
          </div>

          {/* Links on the Right */}
          <div className={styles.navLinks}>
            <a href="/" className={styles.navLink}>Chat</a>
            <a href="https://wotgonline.com/donate/" target="_blank" rel="noopener noreferrer" className={styles.navLink}>Give</a>
          </div>
        </div>

        {/* Livestream Section */}
        <div className={styles.streamSection}>
          <iframe 
              width="100%" 
              height="100%" 
              src={`https://www.youtube.com/embed/${videoId}?autoplay=1&mute=0&playsinline=1&cc_load_policy=0&rel=0&modestbranding=1&controls=0&iv_load_policy=3&disablekb=1`} 
              title="YouTube video player" 
              frameBorder="0" 
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" 
              referrerPolicy="strict-origin-when-cross-origin" 
              allowFullScreen
          />
        </div>

        <div className={styles.viewerCounter} onClick={openViewersListModal}>
          <FontAwesomeIcon icon={faEye} className={styles.sendIcon}/> {viewersCount} Watching
        </div>

        {/*<div className={styles.overlay}/>*/}

        {/* Chat Window at the Bottom */}
        {isAuthenticated && wotglivechatroom && (
          <div className={styles.chatSection}>
            <ChatWindowStream
              messages={messages}
              onSendMessage={handleSendMessage}
              selectedChatroom={wotglivechatroom}
              selectedChatroomDetails={selectedChatroomDetails}
              userId={user?.id}
              onSendReaction={sendReaction}
              onMessageReaction={handleReactMessage}
              reactions={reactions}
            />
          </div>
        )}

        {/* Admin Panel for Updating Livestream (Admin Only) */}
        { (userRole === 'admin' || userRole === 'owner') && (
          <div className={styles.adminPanel}>
            <input
              type="text"
              placeholder="Enter new YouTube Video ID"
              value={newVideoId}
              onChange={(e) => setNewVideoId(e.target.value)}
            />
            <button onClick={handleUpdateWorship}>Update</button>
          </div>
        )}

        {isModalOpen && (
          <div className={styles.modalOverlay} onClick={closeViewersListModal}>
            <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
              <h3><FontAwesomeIcon icon={faEye} className={styles.sendIcon}/> Current Viewers</h3>
              <ul className={styles.viewerList}>
                {viewersList.length > 0 ? (
                  viewersList.map((viewer, index) => (
                    <li key={index}>
                      <strong>{viewer.fullName}</strong> <br />
                      {/*<small>{viewer.email}</small>*/}
                    </li>
                  ))
                ) : (
                  <li>No active viewers</li>
                )}
              </ul>
              <button className={styles.closeModalButton} onClick={closeViewersListModal}>Close</button>
            </div>
          </div>
        )}
      </div>

    </div>
  );
};

export default Page;
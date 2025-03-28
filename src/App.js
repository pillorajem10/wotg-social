import { BrowserRouter, Route, Routes } from 'react-router-dom';

// PAGES
import Home from './Pages/Home';
import SignIn from './Pages/SignIn';
import SignUp from './Pages/SignUp';
import Worship from './Pages/Worship';
import Menu from './Pages/Menu';
import Bible from './Pages/Bible';
import Default from './Pages/Default';
import PrivacyPolicy from './Pages/PrivacyPolicy';
import Blogs from './Pages/Blogs';
import BlogDetails from './Pages/BlogDetails';
import UploadVideo from './Pages/UploadVideo';
import WatchVideo from './Pages/WatchVideo';
import ForgotPassword from './Pages/ForgotPassword';
import ResetPassword from './Pages/ResetPassword';
import Journal from './Pages/Journal';
import Commentary from './Pages/Commentary';
import UploadVideoFromFiles from './Pages/UploadVideoFromFiles';

// REDUX
import { useDispatch } from 'react-redux';
import { wotgsocial } from './redux/combineActions';

// COMPONENTS
// import Navbar from './components/Navbar';
// import Footer from './components/Footer';
import AuthRouter from './components/AuthRouter'
import AdminRouter from './components/AdminRouter'
import { useEffect } from 'react';

function App() {
  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(wotgsocial.user.restoreSessionAction());
  }, []);

  return (
    <BrowserRouter>
      <div className="grid-container">
        {/*<header>
          <Navbar />
        </header>*/}
        <main> {/* Add top padding to the main content */}
          <Routes>
            <Route path="/worship" element={<AuthRouter><Worship /></AuthRouter>} />
            <Route path="/menu" element={<AuthRouter><Menu /></AuthRouter>} />
            <Route path="/blogs" element={<AuthRouter><Blogs /></AuthRouter>} />
            <Route path="/bible" element={<AuthRouter><Bible /></AuthRouter>} />
            <Route path="/blog/:id" element={<AuthRouter><BlogDetails /></AuthRouter>} />
            <Route path="/journal/:book/:chapter/:verse/:language/" element={<AuthRouter><Journal /></AuthRouter>} />
            <Route path="/commentary/:book/:chapter/:verse/:language/" element={<AuthRouter><Commentary /></AuthRouter>} />
            <Route path="/blog/record-video/:id" element={<AdminRouter><UploadVideo /></AdminRouter>} />
            <Route path="/blog/upload-video/:id" element={<AdminRouter><UploadVideoFromFiles /></AdminRouter>} />
            <Route path="/blog/watch-video/:id" element={<AuthRouter><WatchVideo /></AuthRouter>} />
            <Route path="/" element={<AuthRouter><Home /></AuthRouter>} />
            <Route path="/login" element={<SignIn />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password/:token" element={<ResetPassword />} />
            <Route path="/register" element={<SignUp />} />
            <Route path="/privacypolicy" element={<PrivacyPolicy />} />
            <Route path="*" element={<Default />} />
          </Routes>
        </main>
        {/*<footer className="footer"><Footer /></footer>*/}
      </div>
    </BrowserRouter>
  );
}

export default App;

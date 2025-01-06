import { BrowserRouter, Route, Routes } from 'react-router-dom';

// PAGES
import Home from './Pages/Home';
import SignIn from './Pages/SignIn';
import SignUp from './Pages/SignUp';

// COMPONENTS
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import AuthRouter from './components/AuthRouter'

// CSS
import './App.css';

function App() {
  return (
    <BrowserRouter>
      <div className="grid-container">
        <header>
          <Navbar />
        </header>
        <main> {/* Add top padding to the main content */}
          <Routes>
            <Route path="/" exact element={<AuthRouter><Home /></AuthRouter>} />
            <Route path="/login" exact element={<SignIn />} />
            <Route path="/register" exact element={<SignUp />} />
          </Routes>
        </main>
        <footer className="footer"><Footer /></footer>
      </div>
    </BrowserRouter>
  );
}

export default App;

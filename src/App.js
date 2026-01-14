import React from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import GameList from './pages/GameList';
import GameDetail from './pages/GameDetail';
import AnalysisResults from './pages/AnalysisResults';
import GameAnalysis from './pages/GameAnalysis';
import SystemInfo from './pages/SystemInfo';
import { ThemeProvider, useTheme } from './ThemeContext';
import './App.css';

const AppContent = () => {
  const location = useLocation();
  const { theme } = useTheme();
  
  const getPageTitle = () => {
    if (location.pathname === '/') return 'Game List';
    if (location.pathname === '/analysis') return 'Analysis Results';
    if (location.pathname === '/system-info') return 'System Information';
    if (location.pathname.startsWith('/game/')) return 'Game Details';
    if (location.pathname.startsWith('/analysis/')) return 'Game Analysis';
    return 'Dashboard';
  };

  return (
    <div className="app" style={{ background: theme.bg }}>
      <Sidebar />
      <div style={{ 
        marginLeft: '260px',
        width: 'calc(100% - 260px)',
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column'
      }}>
        {/* Top Navbar Area */}
        <div style={{
          height: '60px',
          background: theme.navbarBg,
          borderBottom: `1px solid ${theme.border}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 30px',
          position: 'fixed',
          top: 0,
          width: 'calc(100% - 260px)',
          zIndex: 100,
          backdropFilter: 'blur(10px)'
        }}>
          <h2 style={{ 
            fontSize: '18px', 
            fontWeight: '600',
            color: theme.text,
            margin: 0 
          }}>
            {getPageTitle()}
          </h2>
          
          {/* Theme Toggle Button */}
          {/* <button
            onClick={toggleTheme}
            style={{
              background: 'transparent',
              border: `1px solid ${theme.border}`,
              borderRadius: '8px',
              padding: '8px 12px',
              color: theme.primary,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '13px',
              fontWeight: '500',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = theme.buttonHover;
              e.currentTarget.style.borderColor = theme.borderHover;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.borderColor = theme.border;
            }}
          >
            {currentTheme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            {currentTheme === 'dark' ? 'Light' : 'Dark'}
          </button> */}
        </div>
        
        {/* Scrollable Content */}
        <div style={{ 
          flex: 1,
          overflow: 'auto',
          padding: '30px',
          marginTop: '60px'
        }}>
          <Routes>
            <Route path="/" element={<GameList />} />
            <Route path="/game/:appid" element={<GameDetail />} />
            <Route path="/analysis" element={<AnalysisResults />} />
            <Route path="/analysis/:appid" element={<GameAnalysis />} />
            <Route path="/system-info" element={<SystemInfo />} />
          </Routes>
        </div>
      </div>
    </div>
  );
};

function App() {
  return (
    <ThemeProvider>
      <Router>
        <AppContent />
      </Router>
    </ThemeProvider>
  );
}

export default App;

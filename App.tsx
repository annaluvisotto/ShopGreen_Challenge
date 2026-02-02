
import React, { useState, useEffect } from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Header from './components/Header';
import Home from './pages/Home';
import Favorites from './pages/Favorites';
import Ecommerce from './pages/Ecommerce';
import Profile from './pages/Profile';
import Login from './pages/Login';
import Settings from './pages/Settings';
import Notifications from './pages/Notifications';
import { UserRole, Seller } from './types';
import {fetchSellers} from './services/ecommerceService';

function App() {
  const [userRole, setUserRole] = useState<UserRole>(UserRole.ANONYMOUS);
  const [userName, setUserName] = useState<string | null>(null);
  const [favorites, setFavorites] = useState<string[]>([]);

  // Global State for Sellers (Dynamic creation)
  const [sellers, setSellers] = useState<Seller[]>([]);

  // Settings State (RF7)
  const [language, setLanguage] = useState<'it' | 'en' | 'de'>('it');
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [emailNotifications, setEmailNotifications] = useState(true);

  // Apply Theme Effect (RF7.2)
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  const handleLoginSuccess = (user: { role: UserRole; name: string }) => {
    setUserRole(user.role);
    setUserName(user.name);
  };

  useEffect(() => {
    const loadSellers = async () => {
      try {
        const data = await fetchSellers(); // Chiamata senza parametri per caricarli tutti
        setSellers(data);
      } catch (error) {
        console.error("Errore durante il caricamento degli shop:", error);
      }
    };

    loadSellers();
  }, []);

  const handleLogout = () => {
    setUserRole(UserRole.ANONYMOUS);
    setUserName(null);
  };

  const handleUpdateProfile = (data: { username?: string; password?: string }) => {
    if (data.username) {
      setUserName(data.username);
    }
    if (data.password) {
      console.log('Password updated successfully (simulated)');
    }
  };

  // Create or Update Seller Profile
  const handleSaveSellerProfile = (sellerData: Seller) => {
    setSellers(prev => {
      const exists = prev.find(s => s.username === sellerData.username);
      if (exists) {
        return prev.map(s => s.username === sellerData.username ? sellerData : s);
      } else {
        return [...prev, sellerData];
      }
    });
  };

  const toggleFavorite = (id: string) => {
    if (favorites.includes(id)) {
      setFavorites(prev => prev.filter(fid => fid !== id));
    } else {
      setFavorites(prev => [...prev, id]);
    }
  };

  return (
    <Router>
      <div className="min-h-screen flex flex-col font-sans text-gray-900 bg-white dark:bg-gray-900 dark:text-gray-100 transition-colors duration-300">
        <Header 
          userRole={userRole} 
          userName={userName} 
          onLoginClick={() => { /* Navigation handled by Link in Header now */ }}
          onLogoutClick={handleLogout}
        />
        
        <main className="flex-1 relative">
          <Routes>
            <Route 
              path="/" 
              element={<Home userRole={userRole} favorites={favorites} toggleFavorite={toggleFavorite} userName={userName} />} 
            />
            <Route 
              path="/login" 
              element={<Login onLoginSuccess={handleLoginSuccess} />} 
            />
            <Route 
              path="/preferiti" 
              element={
                userRole !== UserRole.ANONYMOUS 
                  ? <Favorites favorites={favorites} removeFavorite={toggleFavorite} /> 
                  : <Navigate to="/login" />
              } 
            />
            {/* Pass dynamic sellers list to Ecommerce */}
            <Route path="/ecommerce" element={<Ecommerce sellers={sellers} />} />
            
            <Route 
              path="/notifiche" 
              element={
                userRole !== UserRole.ANONYMOUS 
                  ? <Notifications userRole={userRole} />
                  : <Navigate to="/login" />
              } 
            />

            <Route 
              path="/profilo" 
              element={
                userRole !== UserRole.ANONYMOUS 
                  ? <Profile 
                      userRole={userRole} 
                      currentUserName={userName} 
                      onUpdateProfile={handleUpdateProfile}
                      sellers={sellers}
                      onSaveSellerProfile={handleSaveSellerProfile}
                    />
                  : <Navigate to="/login" />
              } 
            />
            
            <Route 
              path="/impostazioni" 
              element={
                userRole !== UserRole.ANONYMOUS 
                  ? <Settings 
                      language={language}
                      setLanguage={setLanguage}
                      theme={theme}
                      setTheme={setTheme}
                      emailNotifications={emailNotifications}
                      setEmailNotifications={setEmailNotifications}
                    />
                  : <Navigate to="/login" />
              } 
            />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;

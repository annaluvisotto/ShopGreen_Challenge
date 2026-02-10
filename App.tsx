import React, { useState, useEffect } from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Header from './components/Header';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Favorites from './pages/Favorites';
import Ecommerce from './pages/Ecommerce';
import Profile from './pages/Profile';
import Login from './pages/Login';
import Settings from './pages/Settings';
import Notifications from './pages/Notifications';
import { UserRole, Seller } from './types';
import { fetchSellers } from './services/ecommerceService';
import { getPreferiti, addPreferito, deletePreferito } from './services/preferitiService';

function App() {
  const [userRole, setUserRole] = useState<UserRole>(UserRole.ANONYMOUS);
  const [userName, setUserName] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [sellers, setSellers] = useState<Seller[]>([]);
  const [language, setLanguage] = useState<'it' | 'en' | 'de'>('it');
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [favorites, setFavorites] = useState<string[]>([]);

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  useEffect(() => {
    const storedUserId = localStorage.getItem('userId');
    const storedRole = localStorage.getItem('role') as UserRole;
    const storedName = localStorage.getItem('username');

    if (storedUserId && storedRole && storedRole !== 'anonimo') {
      setUserId(storedUserId);
      setUserRole(storedRole);
      if (storedName) setUserName(storedName);
      loadFavorites(storedUserId);
    }
    loadSellers();
  }, []);

  const loadSellers = async () => {
    try {
      const data = await fetchSellers();
      setSellers(data);
    } catch (error) {
      console.error("Errore caricamento shop:", error);
    }
  };

  const loadFavorites = async (id: string) => {
    try {
      const shops = await getPreferiti(id);
      setFavorites(shops.map(s => s.id));
    } catch (error) {
      console.error("Errore caricamento preferiti:", error);
    }
  };

  const handleLoginSuccess = (user: { role: UserRole; name: string; id: string }) => {
    setUserRole(user.role);
    setUserName(user.name);
    setUserId(user.id);
    loadFavorites(user.id);
  };

  const handleLogout = () => {
    setUserRole(UserRole.ANONYMOUS);
    setUserName(null);
    setUserId(null);
    setFavorites([]);
    localStorage.clear();
  };

  const handleToggleFavorite = async (shopId: string) => {
    if (!userId || userRole === UserRole.ANONYMOUS) {
      alert("Devi effettuare il login per gestire i preferiti.");
      return;
    }

    const isAlreadyFavorite = favorites.includes(shopId);

    if (isAlreadyFavorite) {
        setFavorites(prev => prev.filter(id => id !== shopId));
    } else {
        setFavorites(prev => [...prev, shopId]);
    }

    try {
      if (isAlreadyFavorite) {
        await deletePreferito(userId, shopId);
      } else {
        await addPreferito(userId, shopId);
      }
    } catch (error) {
      console.error(error);
      alert("Errore di connessione: impossibile aggiornare i preferiti.");
      if (isAlreadyFavorite) {
          setFavorites(prev => [...prev, shopId]);
      } else {
          setFavorites(prev => prev.filter(id => id !== shopId));
      }
    }
  };

  const handleRemoveFavoriteFromList = (id: string) => {
      setFavorites(prev => prev.filter(favId => favId !== id));
  };

  const handleUpdateProfile = (data: { username?: string; password?: string }) => {
    if (data.username) setUserName(data.username);
  };

  const handleSaveSellerProfile = (sellerData: Seller) => {
    setSellers(prev => {
      const exists = prev.find(s => s.username === sellerData.username);
      return exists ? prev.map(s => s.username === sellerData.username ? sellerData : s) : [...prev, sellerData];
    });
  };

  return (
    <Router>
      <div className="h-[100dvh] w-full flex flex-col font-sans text-gray-900 bg-white dark:bg-gray-900 dark:text-gray-100 transition-colors duration-300 overflow-hidden relative">
        <div className="flex-none z-50 shadow-sm relative">
            <Header 
              userRole={userRole} 
              userName={userName} 
              onLoginClick={() => {}}
              onLogoutClick={handleLogout}
            />
        </div>
        <main className="flex-1 overflow-y-auto overflow-x-hidden relative w-full pb-0 md:pb-0 scroll-smooth">
          <Routes>
            <Route 
              path="/" 
              element={
                <Home 
                  userRole={userRole} 
                  favorites={favorites} 
                  toggleFavorite={handleToggleFavorite} 
                  userName={userId} 
                />
              } 
            />
            
            <Route 
              path="/login" 
              element={<Login onLoginSuccess={handleLoginSuccess} />} 
            />
            
            <Route 
              path="/preferiti" 
              element={
                userRole !== UserRole.ANONYMOUS 
                  ? <Favorites 
                      currentUserId={userId} 
                      onRemoveUpdate={handleRemoveFavoriteFromList} 
                    /> 
                  : <Navigate to="/login" />
              } 
            />
            
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
                      language={language} setLanguage={setLanguage}
                      theme={theme} setTheme={setTheme}
                      emailNotifications={emailNotifications} setEmailNotifications={setEmailNotifications}
                    />
                  : <Navigate to="/login" />
              } 
            />
          </Routes>
        </main>
        
        <div className="md:hidden fixed bottom-0 left-0 w-full z-[1000]">
           <Navbar />
        </div>

      </div>
    </Router>
  );
}

export default App;
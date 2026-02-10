import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Heart, ShoppingBag } from 'lucide-react';

const Navbar: React.FC = () => {
  const location = useLocation();
  const isActive = (path: string) => location.pathname === path;

  const getLinkClass = (path: string) => `
    flex flex-col items-center justify-center w-full h-full space-y-1
    ${isActive(path) 
      ? 'text-green-600 dark:text-green-400' 
      : 'text-gray-500 dark:text-gray-400 hover:text-green-600 dark:hover:text-green-300'}
  `;

  return (
    <div className="w-full h-16 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 flex items-center justify-around px-2 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)]">
      
      <Link to="/" className={getLinkClass('/')}>
        <Home className={`w-6 h-6 ${isActive('/') ? 'fill-current' : ''}`} />
        <span className="text-[10px] font-medium">Home</span>
      </Link>

      <Link to="/preferiti" className={getLinkClass('/preferiti')}>
        <Heart className={`w-6 h-6 ${isActive('/preferiti') ? 'fill-current' : ''}`} />
        <span className="text-[10px] font-medium">Preferiti</span>
      </Link>

      <Link to="/ecommerce" className={getLinkClass('/ecommerce')}>
        <ShoppingBag className={`w-6 h-6 ${isActive('/ecommerce') ? 'fill-current' : ''}`} />
        <span className="text-[10px] font-medium">Shop</span>
      </Link>

    </div>
  );
};

export default Navbar;
import React, { useEffect, useState } from 'react';
import { ShopStatus, ShopFavorite } from '../types';
import { Trash2, Loader2, Navigation, MapPin } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { getPreferiti, deletePreferito } from '../services/preferitiService';

interface FavoritesProps {
  currentUserId: string | null;
  onRemoveUpdate: (id: string) => void; 
}

const Favorites: React.FC<FavoritesProps> = ({ currentUserId, onRemoveUpdate }) => {
  const [favoriteShops, setFavoriteShops] = useState<ShopFavorite[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchFavorites = async () => {
      if (!currentUserId) return;
      setIsLoading(true);
      try {
        const favorites = await getPreferiti(currentUserId);
        setFavoriteShops(favorites);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };
    fetchFavorites();
  }, [currentUserId]);

  const handleRemove = async (e: React.MouseEvent, shopId: string) => {
    e.stopPropagation(); 
    if (!currentUserId || !window.confirm("Vuoi rimuovere dai preferiti?")) return;

    try {
      await deletePreferito(currentUserId, shopId);
      setFavoriteShops(prev => prev.filter(s => s.id !== shopId));
      onRemoveUpdate(shopId);
    } catch (err) {
      alert("Errore durante la rimozione");
    }
  };

  const handleCardClick = (shop: ShopFavorite) => {
    navigate('/', { 
      state: { 
        focusShopId: shop.id,    
        center: shop.coordinates   
      } 
    });
  };

  const getStatusInfo = (status: ShopStatus) => {
    switch (status) {
      case ShopStatus.OPEN: 
        return { color: 'bg-green-500', text: 'text-green-700', label: 'Aperto' };
      case ShopStatus.OPENING_SOON: 
        return { color: 'bg-yellow-500', text: 'text-yellow-700', label: 'Apre a breve' };
      case ShopStatus.CLOSED: 
        return { color: 'bg-red-500', text: 'text-red-700', label: 'Chiuso' };
      default: 
        return { color: 'bg-gray-400', text: 'text-gray-500', label: 'Non verificato' };
    }
  };

  if (isLoading) return <div className="flex justify-center p-10"><Loader2 className="animate-spin text-green-600"/></div>;
  if (error) return <div className="text-center p-10 text-red-500">{error}</div>;

  return (
    <div className="max-w-4xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">I tuoi Preferiti</h1>

      {favoriteShops.length === 0 ? (
        <div className="text-center py-10 text-gray-500">Nessun preferito salvato.</div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {favoriteShops.map((shop) => {
            const statusInfo = getStatusInfo(shop.status);
            return (
              <div 
                key={shop.id} 
                onClick={() => handleCardClick(shop)}
                className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 hover:shadow-md hover:border-green-400 transition-all cursor-pointer flex justify-between items-center group"
              >
                <div>
                    <h3 className="font-bold text-gray-800 group-hover:text-green-700 transition-colors">
                        {shop.name}
                    </h3>
                    <div className="flex items-center gap-2 mt-1">
                        <div className={`w-2 h-2 rounded-full ${statusInfo.color}`}></div>
                        <span className="text-xs text-gray-500">{statusInfo.label}</span>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                     <div className="p-2 bg-gray-50 rounded-full text-gray-400 group-hover:text-green-600 group-hover:bg-green-50 transition-colors">
                        <MapPin className="w-5 h-5" />
                     </div>
                     <button 
                      onClick={(e) => handleRemove(e, shop.id)}
                      className="p-2 text-gray-300 hover:text-red-500 transition-colors"
                      title="Rimuovi"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Favorites;
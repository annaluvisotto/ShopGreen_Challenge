import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { MapContainer, TileLayer, useMapEvents, useMap } from 'react-leaflet';
import { Search, Plus, Loader2, AlertTriangle, RefreshCcw } from 'lucide-react'; 
import { Shop, ShopCategory, UserRole } from '../types';
import { TRENTO_CENTER } from '../constants';
import CustomMarker from '../components/CustomMarker';
import AddShopModal from '../components/AddShopModal';
import EditShopModal from '../components/EditShopModal';
import { useLocation, useNavigate } from 'react-router-dom';

import { getNegozi, createNegozio, updateNegozio } from '../services/negoziService';
import { sendFeedback } from '../services/feedbackService';

const MapController: React.FC<{ 
  center: { lat: number; lng: number }; 
  onMove: (center: { lat: number; lng: number }) => void;
  zoom?: number; 
}> = ({ center, onMove, zoom }) => {
  const map = useMap();
  useEffect(() => {
    if (center) {
      map.setView([center.lat, center.lng], zoom || map.getZoom(), { animate: true });
    }
  }, [center, zoom, map]);
  useMapEvents({ moveend: () => onMove(map.getCenter()) });
  return null;
};

const convertHoursToBackend = (rawHours: any[]) => {
    const dayMap: { [key: string]: string } = { 'Lunedì': 'lunedi', 'Martedì': 'martedi', 'Mercoledì': 'mercoledi', 'Giovedì': 'giovedi', 'Venerdì': 'venerdi', 'Sabato': 'sabato', 'Domenica': 'domenica' };
    const backendHours: any = {};
    rawHours.forEach((item: any) => {
        const dbKey = dayMap[item.day];
        if (!dbKey) return;
        if (item.isClosed) { backendHours[dbKey] = { chiuso: true, slot: [] }; } 
        else {
            const slots = [];
            if (item.openMorning && item.closeMorning) slots.push({ apertura: item.openMorning, chiusura: item.closeMorning });
            if (item.openAfternoon && item.closeAfternoon) slots.push({ apertura: item.openAfternoon, chiusura: item.closeAfternoon });
            if (slots.length === 0) slots.push({ apertura: "09:00", chiusura: "18:00" });
            backendHours[dbKey] = { chiuso: false, slot: slots };
        }
    });
    return backendHours;
};

const MapInvalidator = () => {
  const map = useMap();
  useEffect(() => { const timer = setTimeout(() => { map.invalidateSize(); }, 200); return () => clearTimeout(timer); }, [map]);
  return null;
};

interface HomeProps {
  userRole: UserRole;
  favorites: string[];
  toggleFavorite: (id: string) => void;
  userName?: string | null; 
}

type FilterType = ShopCategory | 'Tutte';

const Home: React.FC<HomeProps> = ({ userRole, favorites, toggleFavorite, userName }) => {
  const [activeCategory, setActiveCategory] = useState<FilterType>('Tutte');
  const [searchQuery, setSearchQuery] = useState('');
  
  const [mapCenter, setMapCenter] = useState(TRENTO_CENTER);
  const [mapZoom, setMapZoom] = useState(14);

  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [shops, setShops] = useState<Shop[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  const [isAddModalOpen, setAddModalOpen] = useState(false);
  const [addModalInitialData, setAddModalInitialData] = useState<{name?: string, ownerId?: string} | undefined>(undefined);
  const [editingShop, setEditingShop] = useState<Shop | null>(null);

  const [forceOpenId, setForceOpenId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
      const storedUserId = localStorage.getItem('userId');
      const storedRole = localStorage.getItem('role');        
      if (storedUserId && storedRole !== 'anonimo') setCurrentUserId(storedUserId);
      else setCurrentUserId(null);
  }, []);

  const fetchShops = async () => {
    setIsLoading(true); setError(null);
    try {
      const categoryParam = activeCategory === 'Tutte' ? undefined : activeCategory;
      const data = await getNegozi(undefined, categoryParam, true);
      setShops(data);
    } catch (err: any) {
      console.error("Errore nel caricamento delle attività:", err);
      setError(err.message);
    } finally { setIsLoading(false); }
  };

  useEffect(() => { fetchShops(); }, [activeCategory]);

  useEffect(() => {
    if (location.state) {
        if (location.state.focusShopId && location.state.center) {
            const { focusShopId, center } = location.state;
            setMapCenter(center); setMapZoom(16); setForceOpenId(focusShopId);
            navigate(location.pathname, { replace: true, state: {} });
        } else if (location.state.action === 'create_shop_from_report') {
            const { data } = location.state;
            setAddModalInitialData({ name: data.name, ownerId: data.ownerId });
            setAddModalOpen(true);
            navigate(location.pathname, { replace: true, state: {} });
        }
    }
  }, [location, navigate]);

  const handleAddShop = async (formData: any) => {
    try {
      let orariBackend;
      if (formData.rawHours) orariBackend = convertHoursToBackend(formData.rawHours);
      else orariBackend = { lunedi: { chiuso: false, slot: [{ apertura: "09:00", chiusura: "18:00" }] }, martedi: { chiuso: false, slot: [{ apertura: "09:00", chiusura: "18:00" }] }, mercoledi: { chiuso: false, slot: [{ apertura: "09:00", chiusura: "18:00" }] }, giovedi: { chiuso: false, slot: [{ apertura: "09:00", chiusura: "18:00" }] }, venerdi: { chiuso: false, slot: [{ apertura: "09:00", chiusura: "18:00" }] }, sabato: { chiuso: false, slot: [{ apertura: "09:00", chiusura: "18:00" }] }, domenica: { chiuso: true, slot: [] } };

      const backendPayload = {
        nome: formData.name,
        coordinate: [formData.coordinates.lat, formData.coordinates.lng],
        categoria: formData.categories && formData.categories.length > 0 ? formData.categories : ["altro"], 
        licenzaOppureFoto: formData.imageUrl || "https://placehold.co/400", 
        linkSito: formData.website,
        orari: orariBackend,
        proprietario: formData.ownerId
      };

      if (formData.isExistingUpdate === true && formData.id) { await updateNegozio(formData.id, backendPayload); alert("Richiesta di rivendicazione inviata con successo!"); } 
      else { await createNegozio(backendPayload); alert("Nuova attività segnalata con successo!"); }
      
      await fetchShops(); setAddModalOpen(false); setAddModalInitialData(undefined);
    } catch (error: any) { console.error(error); alert("Errore durante la creazione: " + error.message); }
  };

  const handleUpdateShop = async (updatedShop: Shop) => {
      try {
        let orariBackend;
        if (updatedShop.rawHours) orariBackend = convertHoursToBackend(updatedShop.rawHours);
        const backendPayload = {
            nome: updatedShop.name, licenzaOppureFoto: updatedShop.imageUrl, linkSito: updatedShop.website, categoria: updatedShop.categories, maps: updatedShop.googleMapsLink, mappe: updatedShop.iosMapsLink, coordinate: [updatedShop.coordinates.lat, updatedShop.coordinates.lng],
            ...(orariBackend && { orari: orariBackend }), ...(updatedShop.ownerId && { proprietario: updatedShop.ownerId })
        };
        await updateNegozio(updatedShop.id, backendPayload); await fetchShops(); setEditingShop(null); alert("Negozio aggiornato con successo!");
      } catch (error: any) { alert("Errore modifica: " + error.message); }
  };

  const handleVerify = async (id: string, isPositive: boolean) => {
      if (!currentUserId) return;
      try { await sendFeedback(id, isPositive); await fetchShops(); alert(isPositive ? "Voto positivo inviato! " : "Segnalazione negativa inviata! "); } 
      catch (error: any) { alert(error.message); }
  };

  const handleAddReview = (id: string, comment: string) => { alert("Le recensioni testuali saranno disponibili a breve! Per ora usa i voti Sostenibile/Non Sostenibile."); };

  const filteredShops = useMemo(() => {
    return shops.filter(shop => { const matchesSearch = shop.name.toLowerCase().includes(searchQuery.toLowerCase()); return matchesSearch; });
  }, [shops, searchQuery]);

  const categories = [ { label: 'Tutte', value: 'Tutte' as FilterType }, { label: 'Vestiti', value: ShopCategory.CLOTHING }, { label: 'Alimenti', value: ShopCategory.FOOD }, { label: 'Cura casa/persona', value: ShopCategory.HOME_CARE }, ];

  const handleMapMove = useCallback((center: { lat: number; lng: number }) => { }, []);

  if (error) {
    return (
      <div className="relative w-full h-[calc(100vh-64px)] bg-gray-50 flex flex-col items-center justify-center p-4">
        <div className="bg-white p-8 rounded-3xl shadow-xl text-center max-w-lg border border-red-100 animate-in zoom-in duration-300">
          <div className="mx-auto w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mb-6"><AlertTriangle className="w-10 h-10 text-red-500" /></div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Problema di connessione</h2>
          <p className="text-gray-500 mb-8 leading-relaxed">{error}<br /><span className="text-xs text-gray-400 mt-2 block font-mono bg-gray-100 py-1 px-2 rounded mt-2 inline-block">Il server fallisce nel stabilire una connessione con il database</span></p>
          <button onClick={() => window.location.reload()} className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3.5 rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-red-200 hover:shadow-red-300 hover:-translate-y-1"><RefreshCcw className="w-5 h-5" />Ricarica la pagina</button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full overflow-hidden bg-gray-100">
      <div className="absolute top-4 left-4 right-4 z-[400] flex flex-col gap-3 pointer-events-none">
        <div className="w-full max-w-2xl pointer-events-auto shadow-lg">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input type="text" className="block w-full pl-10 pr-3 py-3 border border-gray-200 rounded-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 sm:text-sm transition-shadow" placeholder="Cerca negozio..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
          </div>
        </div>

        <div className="flex flex-wrap gap-2 pointer-events-auto">
          {categories.map((cat) => (
            <button key={cat.value} onClick={() => setActiveCategory(cat.value)} className={`px-4 py-1.5 rounded-full text-sm font-semibold shadow-md transition-all transform hover:scale-105 ${activeCategory === cat.value ? 'bg-green-700 text-white ring-2 ring-green-800' : 'bg-white text-gray-700 hover:bg-green-50'}`}>
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      <MapContainer center={[TRENTO_CENTER.lat, TRENTO_CENTER.lng]} zoom={14} scrollWheelZoom={true} className="w-full h-full" zoomControl={false}>
        <TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        <MapInvalidator />
        <MapController center={mapCenter} zoom={mapZoom} onMove={handleMapMove} />

        {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center z-[1000] bg-black/20 pointer-events-none">
                <div className="bg-white p-4 rounded-full shadow-xl animate-spin"><Loader2 className="w-8 h-8 text-green-600" /></div>
            </div>
        )}

        {filteredShops.map(shop => (
          <CustomMarker key={shop.id} shop={shop} userRole={userRole} userName={currentUserId} isFavorite={favorites.includes(shop.id)} onToggleFavorite={toggleFavorite} onVerify={handleVerify} onAddReview={handleAddReview} onEditClick={(s) => setEditingShop(s)} forceOpen={forceOpenId === shop.id || filteredShops.length === 1} />
        ))}
      </MapContainer>

      {userRole !== UserRole.ANONYMOUS && (
        <div className="absolute bottom-24 md:bottom-6 right-6 z-[400] pointer-events-auto">
          <button 
            onClick={() => { setAddModalInitialData(undefined); setAddModalOpen(true); }}
            className="flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white p-4 md:px-5 md:py-3 rounded-full shadow-xl font-bold transition-all hover:scale-105"
          >
            <Plus className="w-6 h-6" />
            <span className="hidden md:inline">Segnala nuova attività</span>
          </button>
        </div>
      )}

      <AddShopModal isOpen={isAddModalOpen} onClose={() => { setAddModalOpen(false); setAddModalInitialData(undefined); }} onSubmit={handleAddShop} userRole={userRole} currentMapCenter={mapCenter} existingShops={shops} initialData={addModalInitialData} currentUserId={currentUserId} />
      <EditShopModal shop={editingShop} isOpen={!!editingShop} onClose={() => setEditingShop(null)} onUpdate={handleUpdateShop} userRole={userRole} currentUserId={currentUserId} />

    </div>
  );
};

export default Home;
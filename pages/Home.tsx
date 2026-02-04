//versione che utilizza i mock

/**import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { MapContainer, TileLayer, useMapEvents, useMap } from 'react-leaflet';
import { Search, Plus } from 'lucide-react';
import { Shop, ShopCategory, ShopStatus, UserRole } from '../types';
import { MOCK_SHOPS, TRENTO_CENTER } from '../constants';
import CustomMarker from '../components/CustomMarker';
import AddShopModal from '../components/AddShopModal';
import EditShopModal from '../components/EditShopModal';
import { useLocation, useNavigate } from 'react-router-dom';

// Helper to track map center for the "Add Shop" modal
const MapController: React.FC<{ onMove: (center: { lat: number; lng: number }) => void }> = ({ onMove }) => {
  const map = useMapEvents({
    moveend: () => {
      onMove(map.getCenter());
    },
  });
  return null;
};

// Fix for map rendering issues (grey tiles)
const MapInvalidator = () => {
  const map = useMap();
  useEffect(() => {
    // Small timeout to ensure container is fully rendered by DOM before invalidating size
    const timer = setTimeout(() => {
      map.invalidateSize();
    }, 200);
    return () => clearTimeout(timer);
  }, [map]);
  return null;
};

interface HomeProps {
  userRole: UserRole;
  favorites: string[];
  toggleFavorite: (id: string) => void;
  // We need to know WHO is voting now
  userName?: string | null; 
}

const Home: React.FC<HomeProps> = ({ userRole, favorites, toggleFavorite }) => {
  const [activeCategory, setActiveCategory] = useState<ShopCategory>(ShopCategory.ALL);
  const [searchQuery, setSearchQuery] = useState('');
  const [mapCenter, setMapCenter] = useState(TRENTO_CENTER);
  
  // Need to get userName from auth service conceptually, but in this mock structure 
  // we can infer it or we should have passed it from App. For now, assuming "Mario Rossi" or similar if logged in.
  const mockCurrentUserId = userRole === UserRole.ANONYMOUS ? null : (userRole === UserRole.OPERATOR ? 'Operator1' : 'Mario Rossi');

  // Local state for shops
  const [shops, setShops] = useState<Shop[]>(MOCK_SHOPS);
  
  // Modal State
  const [isAddModalOpen, setAddModalOpen] = useState(false);
  const [addModalInitialData, setAddModalInitialData] = useState<{name?: string, ownerId?: string} | undefined>(undefined);
  
  // Edit Modal State (RF11)
  const [editingShop, setEditingShop] = useState<Shop | null>(null);

  const location = useLocation();
  const navigate = useNavigate();

  // Handle navigation from Notification (Report Approval)
  useEffect(() => {
    if (location.state && location.state.action === 'create_shop_from_report') {
        const { data } = location.state;
        setAddModalInitialData({
            name: data.name,
            ownerId: data.ownerId
        });
        setAddModalOpen(true);
        // Clear state to avoid reopening on refresh
        window.history.replaceState({}, document.title);
    }
  }, [location]);


  // Handle creating a new shop (RF8)
  const handleAddShop = (newShop: Shop) => {
    setShops(prev => [...prev, newShop]);
    setAddModalOpen(false);
    setAddModalInitialData(undefined);
    
    // Different message if created by Operator vs User
    if (newShop.ownerId) {
       alert(`Attività "${newShop.name}" creata e associata a "${newShop.ownerId}".\nStato: Non Verificato (Grigio).`);
    } else {
       alert(`Attività "${newShop.name}" inserita con successo!\nStato: Non Verificato (Grigio).\nIn attesa di 8 feedback positivi per diventare verde.`);
    }
  };

  // Handle updating an existing shop (RF11)
  const handleUpdateShop = (updatedShop: Shop) => {
     setShops(prev => prev.map(s => s.id === updatedShop.id ? updatedShop : s));
     setEditingShop(null); // Close modal
  };

  // RF17: Handle Verification/Feedback
  const handleVerify = (id: string, isPositive: boolean) => {
     if (!mockCurrentUserId) return;

     setShops(prev => prev.map(shop => {
        if (shop.id === id) {
           // Prevent double voting logic is handled in UI (disabled buttons), but good to check here too
           if (shop.votes[mockCurrentUserId]) return shop;

           const voteType = isPositive ? 'up' : 'down';
           const scoreChange = isPositive ? 1 : -1;
           const newScore = shop.sustainabilityScore + scoreChange;
           
           // Copy votes and add new one
           const newVotes = { ...shop.votes, [mockCurrentUserId]: voteType as 'up' | 'down' };

           // Check logic: 8 positives = verified (green)
           let newStatus = shop.status;
           if (newScore >= 8 && shop.status === ShopStatus.UNVERIFIED) {
              newStatus = ShopStatus.OPEN;
           } else if (newScore <= -8) {
              newStatus = ShopStatus.CLOSED; 
           }
           
           return { 
             ...shop, 
             sustainabilityScore: newScore, 
             status: newStatus,
             votes: newVotes
           };
        }
        return shop;
     }));
  };

  const handleAddReview = (id: string, comment: string) => {
    if (!mockCurrentUserId) return;
    
    setShops(prev => prev.map(shop => {
      if (shop.id === id) {
        const newReview = {
          id: Date.now().toString(),
          user: mockCurrentUserId,
          comment: comment,
          date: new Date().toISOString().split('T')[0]
        };
        return { ...shop, reviews: [...shop.reviews, newReview] };
      }
      return shop;
    }));
  };

  const filteredShops = useMemo(() => {
    return shops.filter(shop => {
      const matchesCategory = activeCategory === ShopCategory.ALL || shop.category === activeCategory;
      const matchesSearch = shop.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            shop.address.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [shops, activeCategory, searchQuery]);

  const categories = [
    { label: 'Tutte', value: ShopCategory.ALL },
    { label: 'Vestiti', value: ShopCategory.CLOTHING },
    { label: 'Alimenti', value: ShopCategory.FOOD },
    { label: 'Cura casa/persona', value: ShopCategory.HOME_CARE },
  ];

  // Stabilize the callback to prevent infinite loops if MapController re-renders
  const handleMapMove = useCallback((center: { lat: number; lng: number }) => {
    setMapCenter(center);
  }, []);

  return (
    <div className="relative w-full h-[calc(100vh-64px)] overflow-hidden bg-gray-100">
      
      {}
      <div className="absolute top-4 left-4 right-4 z-[400] flex flex-col gap-3 pointer-events-none">
        
        {}
        <div className="w-full max-w-2xl pointer-events-auto shadow-lg">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              className="block w-full pl-10 pr-3 py-3 border border-gray-200 rounded-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 sm:text-sm transition-shadow"
              placeholder="Cerca negozio, via o prodotto..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {}
        <div className="flex flex-wrap gap-2 pointer-events-auto">
          {categories.map((cat) => (
            <button
              key={cat.value}
              onClick={() => setActiveCategory(cat.value)}
              className={`
                px-4 py-1.5 rounded-full text-sm font-semibold shadow-md transition-all transform hover:scale-105
                ${activeCategory === cat.value 
                  ? 'bg-green-700 text-white ring-2 ring-green-800' 
                  : 'bg-white text-gray-700 hover:bg-green-50'}
              `}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {}
      <MapContainer 
        center={[TRENTO_CENTER.lat, TRENTO_CENTER.lng]} 
        zoom={14} 
        scrollWheelZoom={true} 
        className="w-full h-full"
        zoomControl={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        {}
        <MapInvalidator />
        
        {}
        <MapController onMove={handleMapMove} />

        {}
        {filteredShops.map(shop => (
          <CustomMarker 
            key={shop.id} 
            shop={shop} 
            userRole={userRole}
            userName={mockCurrentUserId}
            isFavorite={favorites.includes(shop.id)}
            onToggleFavorite={toggleFavorite}
            onVerify={handleVerify}
            onAddReview={handleAddReview}
            // RF11: Pass edit handler
            onEditClick={(s) => setEditingShop(s)}
            // Logic for auto-opening popup: if only 1 result is found in filtered list
            forceOpen={filteredShops.length === 1}
          />
        ))}

      </MapContainer>

      {}
      {userRole !== UserRole.ANONYMOUS && (
        <div className="absolute bottom-6 right-6 z-[400] pointer-events-auto">
          <button 
            onClick={() => {
                setAddModalInitialData(undefined);
                setAddModalOpen(true);
            }}
            className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-5 py-3 rounded-full shadow-xl font-bold transition-all hover:scale-105"
          >
            <Plus className="w-5 h-5" />
            Segnala nuova attività
          </button>
        </div>
      )}

      {}
      <AddShopModal 
        isOpen={isAddModalOpen} 
        onClose={() => {
            setAddModalOpen(false);
            setAddModalInitialData(undefined);
        }}
        onSubmit={handleAddShop}
        userRole={userRole}
        currentMapCenter={mapCenter}
        existingShops={shops}
        initialData={addModalInitialData}
      />

      {}
      <EditShopModal
        shop={editingShop}
        isOpen={!!editingShop}
        onClose={() => setEditingShop(null)}
        onUpdate={handleUpdateShop}
        userRole={userRole}
      />

    </div>
  );
};

export default Home;**/




//versione che utilizza i services e si collega al backend

import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { MapContainer, TileLayer, useMapEvents, useMap } from 'react-leaflet';
import { Search, Plus, Loader2 } from 'lucide-react'; 
import { Shop, ShopCategory, UserRole } from '../types';
import { TRENTO_CENTER } from '../constants';
import CustomMarker from '../components/CustomMarker';
import AddShopModal from '../components/AddShopModal';
import EditShopModal from '../components/EditShopModal';
import { useLocation } from 'react-router-dom';

// --- IMPORTIAMO I SERVIZI REALI ---
import { getNegozi, createNegozio, updateNegozio } from '../services/negoziService';
import { sendFeedback } from '../services/feedbackService';
import { Filter } from 'mongodb';

// Helper per tracciare il centro della mappa
const MapController: React.FC<{ onMove: (center: { lat: number; lng: number }) => void }> = ({ onMove }) => {
  const map = useMapEvents({
    moveend: () => {
      onMove(map.getCenter());
    },
  });
  return null;
};

// Helper per convertire gli orari dal Form al Backend
// Helper per convertire gli orari dal Form (4 campi) al Backend (Array Slot)
const convertHoursToBackend = (rawHours: any[]) => {
    const dayMap: { [key: string]: string } = {
        'Lunedì': 'lunedi',
        'Martedì': 'martedi',
        'Mercoledì': 'mercoledi',
        'Giovedì': 'giovedi',
        'Venerdì': 'venerdi',
        'Sabato': 'sabato',
        'Domenica': 'domenica'
    };

    const backendHours: any = {};

    rawHours.forEach((item: any) => {
        const dbKey = dayMap[item.day];
        if (!dbKey) return;

        if (item.isClosed) {
            backendHours[dbKey] = { chiuso: true, slot: [] };
        } else {
            const slots = [];

            // Aggiungiamo lo slot Mattina se compilato
            if (item.openMorning && item.closeMorning) {
                slots.push({ apertura: item.openMorning, chiusura: item.closeMorning });
            }

            // Aggiungiamo lo slot Pomeriggio se compilato
            if (item.openAfternoon && item.closeAfternoon) {
                slots.push({ apertura: item.openAfternoon, chiusura: item.closeAfternoon });
            }

            // Se per qualche motivo l'utente apre ma lascia vuoti i campi, mettiamo un default
            if (slots.length === 0) {
                slots.push({ apertura: "09:00", chiusura: "18:00" });
            }

            backendHours[dbKey] = {
                chiuso: false,
                slot: slots
            };
        }
    });

    return backendHours;
};

// Fix per i problemi di rendering della mappa (piastrelle grigie)
const MapInvalidator = () => {
  const map = useMap();
  useEffect(() => {
    const timer = setTimeout(() => {
      map.invalidateSize();
    }, 200);
    return () => clearTimeout(timer);
  }, [map]);
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
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  // --- STATO DATI REALI ---
  const [shops, setShops] = useState<Shop[]>([]); // Iniziamo vuoti!
  const [isLoading, setIsLoading] = useState(false);
  
  // Modal State
  const [isAddModalOpen, setAddModalOpen] = useState(false);
  const [addModalInitialData, setAddModalInitialData] = useState<{name?: string, ownerId?: string} | undefined>(undefined);
  
  // Edit Modal State
  const [editingShop, setEditingShop] = useState<Shop | null>(null);

  const location = useLocation();

  useEffect(() => {
      // 1. Recuperiamo i dati reali salvati dopo il Login
      const storedUserId = localStorage.getItem('userId');
      const storedRole = localStorage.getItem('role');        
      
      if (storedUserId && storedRole !== 'anonimo') {
        setCurrentUserId(storedUserId);
    } else {
        setCurrentUserId(null);
    }
    }, []);

  const fetchShops = async () => {
    setIsLoading(true);
    try {
      // Se la categoria è 'Tutte', passiamo undefined così il service non filtra
      const categoryParam = activeCategory === 'Tutte' ? undefined : activeCategory;
      const data = await getNegozi(undefined, categoryParam, true);
      
      setShops(data);
    } catch (error) {
      console.error("Errore fetch shops:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Ricarica i negozi ogni volta che cambia la categoria selezionata
  useEffect(() => {
    fetchShops();
  }, [activeCategory]);

  // Gestione navigazione da Notifiche (quando si approva una segnalazione)
  useEffect(() => {
    if (location.state && location.state.action === 'create_shop_from_report') {
        const { data } = location.state;
        setAddModalInitialData({
            name: data.name,
            ownerId: data.ownerId
        });
        setAddModalOpen(true);
        // Puliamo lo state per evitare loop
        window.history.replaceState({}, document.title);
    }
  }, [location]);


  // --- 2. CREAZIONE NEGOZIO (CREATE) ---
  const handleAddShop = async (formData: any) => {
    try {
      
      // Calcoliamo gli orari reali se ci sono, altrimenti usiamo un fallback
      let orariBackend;
      
      if (formData.rawHours) {
          orariBackend = convertHoursToBackend(formData.rawHours);
      } else {
          // Fallback di sicurezza (orari default) se qualcosa va storto
          orariBackend = {
             lunedi: { chiuso: false, slot: [{ apertura: "09:00", chiusura: "18:00" }] },
             martedi: { chiuso: false, slot: [{ apertura: "09:00", chiusura: "18:00" }] },
             mercoledi: { chiuso: false, slot: [{ apertura: "09:00", chiusura: "18:00" }] },
             giovedi: { chiuso: false, slot: [{ apertura: "09:00", chiusura: "18:00" }] },
             venerdi: { chiuso: false, slot: [{ apertura: "09:00", chiusura: "18:00" }] },
             sabato: { chiuso: false, slot: [{ apertura: "09:00", chiusura: "18:00" }] },
             domenica: { chiuso: true, slot: [] }
          };
      }

      const backendPayload = {
        nome: formData.name,
        coordinate: [formData.coordinates.lat, formData.coordinates.lng],
        categoria: [formData.category], 
        licenzaOppureFoto: formData.imageUrl || "https://placehold.co/400", 
        linkSito: formData.website,
        
        // USIAMO GLI ORARI CALCOLATI
        orari: orariBackend,
        
        proprietario: formData.ownerId
      };

      if (formData.isExistingUpdate === true && formData.id) {
             // Qui chiamiamo la PUT
             await updateNegozio(formData.id, backendPayload);
             alert("Richiesta di rivendicazione inviata con successo!");
        } else {
             // Qui chiamiamo la POST (che crea il duplicato)
             await createNegozio(backendPayload);
             alert("Nuova attività creata!");
        }
      
      await fetchShops(); 
      setAddModalOpen(false);
      setAddModalInitialData(undefined);

    } catch (error: any) {
      console.error(error);
      alert("Errore durante la creazione: " + error.message);
    }
  };

  // --- 3. MODIFICA NEGOZIO (UPDATE) ---
  const handleUpdateShop = async (updatedShop: Shop) => {
      try {
        let orariBackend;
        if (updatedShop.rawHours) {
          // Utilizziamo la stessa funzione che usi per la creazione!
          orariBackend = convertHoursToBackend(updatedShop.rawHours);
        }
        const backendPayload = {
            nome: updatedShop.name,
            licenzaOppureFoto: updatedShop.imageUrl,
            linkSito: updatedShop.website,
            categoria: updatedShop.categories,
            maps: updatedShop.googleMapsLink,
            mappe: updatedShop.iosMapsLink,
            ...(orariBackend && { orari: orariBackend }),
            ...(updatedShop.ownerId && { proprietario: updatedShop.ownerId })
            // Aggiungi qui altri campi se il modale di edit li gestisce
        };

        await updateNegozio(updatedShop.id, backendPayload);
        
        // Ricarichiamo i dati freschi dal server
        await fetchShops();
        setEditingShop(null); 
        alert("Negozio aggiornato con successo!");

      } catch (error: any) {
        alert("Errore modifica: " + error.message);
      }
  };

  // --- 4. GESTIONE FEEDBACK (VOTO) ---
  const handleVerify = async (id: string, isPositive: boolean) => {
     if (!currentUserId) return;

     
     try {
       // Chiamiamo il service (che gestisce già il token)
       await sendFeedback(id, isPositive);
       
       // Ricarichiamo i negozi per aggiornare il colore/punteggio
       await fetchShops();
       
       alert(isPositive ? "Voto positivo inviato! 👍" : "Segnalazione negativa inviata! 👎");

     } catch (error: any) {
       // Se l'errore è "Hai già votato", il service ci passa il messaggio giusto
       alert(error.message);
     }
  };

  // Placeholder per recensioni testuali (futuro)
  const handleAddReview = (id: string, comment: string) => {
    alert("Le recensioni testuali saranno disponibili a breve! Per ora usa i voti Sostenibile/Non Sostenibile.");
  };

  // --- FILTRO CLIENT-SIDE (Solo Ricerca Testuale) ---
  // La categoria è già filtrata dal backend nella fetchShops
  const filteredShops = useMemo(() => {
    return shops.filter(shop => {
      const matchesSearch = shop.name.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesSearch;
    });
  }, [shops, searchQuery]);

  const categories = [
    { label: 'Tutte', value: 'Tutte' as FilterType },
    { label: 'Vestiti', value: ShopCategory.CLOTHING },
    { label: 'Alimenti', value: ShopCategory.FOOD },
    { label: 'Cura casa/persona', value: ShopCategory.HOME_CARE },
  ];

  const handleMapMove = useCallback((center: { lat: number; lng: number }) => {
    setMapCenter(center);
  }, []);

  return (
    <div className="relative w-full h-[calc(100vh-64px)] overflow-hidden bg-gray-100">
      
      {/* Barra di Ricerca e Filtri */}
      <div className="absolute top-4 left-4 right-4 z-[400] flex flex-col gap-3 pointer-events-none">
        
        {/* Input Ricerca */}
        <div className="w-full max-w-2xl pointer-events-auto shadow-lg">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              className="block w-full pl-10 pr-3 py-3 border border-gray-200 rounded-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 sm:text-sm transition-shadow"
              placeholder="Cerca negozio, via o prodotto..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>


        {/* Pillole Categorie */}
        <div className="flex flex-wrap gap-2 pointer-events-auto">
          {categories.map((cat) => (
            <button
              key={cat.value}
              onClick={() => setActiveCategory(cat.value)}
              className={`
                px-4 py-1.5 rounded-full text-sm font-semibold shadow-md transition-all transform hover:scale-105
                ${activeCategory === cat.value 
                  ? 'bg-green-700 text-white ring-2 ring-green-800' 
                  : 'bg-white text-gray-700 hover:bg-green-50'}
              `}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Mappa */}
      <MapContainer 
        center={[TRENTO_CENTER.lat, TRENTO_CENTER.lng]} 
        zoom={14} 
        scrollWheelZoom={true} 
        className="w-full h-full"
        zoomControl={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        <MapInvalidator />
        <MapController onMove={handleMapMove} />

        {/* Indicatore di Caricamento */}
        {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center z-[1000] bg-black/20 pointer-events-none">
                <div className="bg-white p-4 rounded-full shadow-xl animate-spin">
                    <Loader2 className="w-8 h-8 text-green-600" />
                </div>
            </div>
        )}

        {/* Markers */}
        {filteredShops.map(shop => (
          <CustomMarker 
            key={shop.id} 
            shop={shop} 
            userRole={userRole}
            userName={currentUserId}
            isFavorite={favorites.includes(shop.id)}
            onToggleFavorite={toggleFavorite}
            onVerify={handleVerify}
            onAddReview={handleAddReview}
            onEditClick={(s) => setEditingShop(s)}
            forceOpen={filteredShops.length === 1}
          />
        ))}

      </MapContainer>

      {/* Bottone "Segnala Attività" */}
      {userRole !== UserRole.ANONYMOUS && (
        <div className="absolute bottom-6 right-6 z-[400] pointer-events-auto">
          <button 
            onClick={() => {
                setAddModalInitialData(undefined);
                setAddModalOpen(true);
            }}
            className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-5 py-3 rounded-full shadow-xl font-bold transition-all hover:scale-105"
          >
            <Plus className="w-5 h-5" />
            Segnala nuova attività
          </button>
        </div>
      )}

      {/* Modale Aggiunta */}
      <AddShopModal 
        isOpen={isAddModalOpen} 
        onClose={() => {
            setAddModalOpen(false);
            setAddModalInitialData(undefined);
        }}
        onSubmit={handleAddShop}
        userRole={userRole}
        currentMapCenter={mapCenter}
        existingShops={shops}
        initialData={addModalInitialData}
        currentUserId={currentUserId}
      />

      {/* Modale Modifica */}
      <EditShopModal
        shop={editingShop}
        isOpen={!!editingShop}
        onClose={() => setEditingShop(null)}
        onUpdate={handleUpdateShop}
        userRole={userRole}
        currentUserId={currentUserId}
      />

    </div>
  );
};

export default Home;
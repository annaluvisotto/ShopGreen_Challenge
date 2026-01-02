
import React, { useState, useMemo, useEffect } from 'react';
import { MOCK_ZONES } from '../constants';
import { MapPin, Search, ShoppingBag, Filter, ArrowLeft, X, ExternalLink, Info, Tag, PlusCircle, Loader2 } from 'lucide-react';
import { Seller } from '../types';
import { Link } from 'react-router-dom';
import * as ecommerceService from '../services/ecommerceService';

interface EcommerceProps {
  sellers: Seller[]; // Still receiving as prop, but we'll fetch our own or rely on App.tsx sync
}

const Ecommerce: React.FC<EcommerceProps> = ({ sellers: initialSellers }) => {
  const [dbSellers, setDbSellers] = useState<Seller[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedZone, setSelectedZone] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('Tutte');
  
  // State for Seller Profile Modal
  const [selectedSeller, setSelectedSeller] = useState<Seller | null>(null);

  // Caricamento dati dal DB
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        // Possiamo filtrare lato server passando i parametri, 
        // o scaricare tutto e filtrare lato client come prima.
        // Qui facciamo un caricamento iniziale completo per fluidità della UI.
        const data = await ecommerceService.fetchSellers();
        setDbSellers(data);
      } catch (err) {
        console.error("Fallimento caricamento E-shops dal database.");
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, []);

  // Extract all unique categories dynamically from current sellers
  const availableCategories = useMemo(() => {
    const allTags = new Set<string>();
    dbSellers.forEach(seller => {
      seller.categories.forEach(cat => allTags.add(cat));
    });
    return Array.from(allTags).sort();
  }, [dbSellers]);

  // Filter Logic
  const filteredSellers = dbSellers.filter(seller => {
    const matchesZone = selectedZone ? seller.zoneIds.includes(selectedZone) : true;
    const matchesCategory = selectedCategory === 'Tutte' || seller.categories.includes(selectedCategory);
    const matchesSearch = seller.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          seller.categories.some(c => c.toLowerCase().includes(searchQuery.toLowerCase()));
    
    return matchesZone && matchesCategory && matchesSearch;
  });

  const categories = ['Tutte', ...availableCategories];
  const activeZoneName = MOCK_ZONES.find(z => z.id === selectedZone)?.name;

  const handleGoBack = () => {
    setSelectedZone(null);
    setSearchQuery('');
    setSelectedCategory('Tutte');
  };

  const getZoneNames = (ids: string[]) => {
    return ids.map(id => MOCK_ZONES.find(z => z.id === id)?.name).filter(Boolean).join(', ');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
        <Loader2 className="w-12 h-12 text-green-600 animate-spin mb-4" />
        <p className="font-bold text-gray-700 italic">Connessione al Mercatino in corso...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Main Header Text */}
        <div className="flex flex-col md:flex-row justify-between items-center mb-4 gap-4">
          <div className="text-center md:text-left">
             <h1 className="text-3xl md:text-4xl font-bold text-gray-900">Mercatino Locale</h1>
             <p className="text-gray-500 max-w-2xl">
               Sincronizzato in tempo reale con il database ShopGreen.
             </p>
          </div>
          
          <Link 
            to="/profilo"
            className="group flex items-center gap-2 bg-[#d9e8cd] hover:bg-[#c4dbb3] text-green-900 px-6 py-3 rounded-2xl font-bold shadow-sm transition-all transform hover:scale-105"
          >
             <PlusCircle className="w-5 h-5" />
             <span>Vendi anche tu</span>
          </Link>
        </div>

        {!selectedZone ? (
          /* VIEW 1: ZONE SELECTION GRID */
          <div className="animate-in fade-in zoom-in duration-300">
             <h2 className="text-xl font-semibold text-center text-gray-700 mb-8">
               Seleziona il tuo quartiere per iniziare
             </h2>
             
             <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-8 max-w-5xl mx-auto">
              {MOCK_ZONES.map((zone) => (
                <button
                  key={zone.id}
                  onClick={() => setSelectedZone(zone.id)}
                  className="group relative flex flex-col items-center justify-center p-10 rounded-3xl bg-white border border-gray-100 shadow-sm hover:shadow-xl hover:border-green-200 transition-all duration-300 hover:-translate-y-1"
                >
                  <div className="w-20 h-20 rounded-full bg-green-50 flex items-center justify-center mb-6 group-hover:bg-green-100 transition-colors">
                    <MapPin className="w-10 h-10 text-green-600" />
                  </div>
                  <span className="text-xl font-bold text-gray-800 group-hover:text-green-800 transition-colors">
                    {zone.name}
                  </span>
                  <div className="mt-2 text-sm text-gray-400 font-medium">
                    {dbSellers.filter(s => s.zoneIds.includes(zone.id)).length} venditori attivi
                  </div>
                </button>
              ))}
            </div>
          </div>
        ) : (
          /* VIEW 2: SELLERS LIST (DETAIL VIEW) */
          <div className="animate-in slide-in-from-right duration-300">
            
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
               <button 
                 onClick={handleGoBack}
                 className="flex items-center gap-2 text-gray-600 hover:text-green-700 font-semibold transition-colors px-3 py-2 rounded-lg hover:bg-gray-100"
               >
                 <ArrowLeft className="w-5 h-5" />
                 Torna alle Zone
               </button>
               <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                 <MapPin className="w-6 h-6 text-green-600" />
                 {activeZoneName}
               </h2>
            </div>

            {/* Search & Filters Bar */}
            <div className="bg-white p-3 rounded-2xl shadow-sm border border-gray-200 flex flex-col lg:flex-row gap-4 items-center mb-8 sticky top-20 z-10">
              <div className="relative flex-1 w-full">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input 
                  type="text" 
                  placeholder={`Cerca in ${activeZoneName}...`}
                  className="w-full pl-12 pr-4 py-3 rounded-xl bg-transparent outline-none text-gray-800 placeholder-gray-400"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              
              <div className="flex overflow-x-auto gap-2 px-2 pb-2 lg:pb-0 w-full lg:w-auto no-scrollbar">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-4 py-2 rounded-lg text-sm font-semibold whitespace-nowrap transition-all
                      ${selectedCategory === cat 
                        ? 'bg-green-600 text-white shadow-md' 
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Sellers Grid */}
            {filteredSellers.length > 0 ? (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredSellers.map((seller) => (
                  <SellerCard 
                    key={seller.id} 
                    seller={seller} 
                    onClick={() => setSelectedSeller(seller)} 
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-gray-300">
                <div className="bg-gray-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Filter className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-1">Nessun risultato</h3>
                <p className="text-gray-500 text-sm">Nessun venditore risponde a questi criteri nel DB.</p>
              </div>
            )}
          </div>
        )}

      </div>

      {/* SELLER PROFILE MODAL */}
      {selectedSeller && (
        <div className="fixed inset-0 z-[3000] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-[30px] shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200 relative">
             
             <div className="h-32 bg-gradient-to-r from-green-600 to-green-400 relative">
                <button 
                  onClick={() => setSelectedSeller(null)}
                  className="absolute top-4 right-4 p-2 bg-black/20 hover:bg-black/40 text-white rounded-full backdrop-blur-md transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
             </div>

             <div className="px-8 pb-8 relative">
                <div className="-mt-16 mb-4 flex justify-between items-end">
                  <div className="relative">
                    <img 
                      src={selectedSeller.avatarUrl} 
                      alt={selectedSeller.username} 
                      className="w-32 h-32 rounded-full object-cover border-4 border-white shadow-lg bg-white" 
                    />
                    <div className="absolute bottom-2 right-2 w-5 h-5 bg-green-500 border-4 border-white rounded-full" title="Verificato"></div>
                  </div>
                </div>

                <div className="space-y-6">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                       {selectedSeller.username}
                    </h2>
                    <div className="flex flex-wrap gap-2 mt-1">
                      <p className="text-green-600 font-medium text-sm">
                        {selectedSeller.categories.length} Categorie
                      </p>
                      <span className="text-gray-300">|</span>
                      <p className="text-gray-500 text-sm flex items-center gap-1">
                         <MapPin className="w-3 h-3"/> Zone: {getZoneNames(selectedSeller.zoneIds)}
                      </p>
                    </div>
                  </div>

                  <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 text-gray-600 text-sm leading-relaxed">
                     <div className="flex items-center gap-2 mb-2 text-gray-900 font-bold text-xs uppercase tracking-wider">
                        <Info className="w-4 h-4 text-green-600" /> Bio & Dettagli
                     </div>
                     {selectedSeller.bio || "Informazioni non disponibili."}
                  </div>

                  <div>
                    <h3 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
                      <Tag className="w-4 h-4 text-gray-400" /> Categorie Prodotti
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {selectedSeller.categories.map(cat => (
                          <span key={cat} className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg text-xs font-bold border border-gray-200">
                              {cat}
                          </span>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h3 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
                      <ShoppingBag className="w-4 h-4 text-gray-400" /> Link Esterni
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {selectedSeller.platformLinks.map((link, idx) => (
                          <a 
                            key={idx} 
                            href={link} 
                            target="_blank" 
                            rel="noreferrer"
                            className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-xl hover:border-green-500 hover:shadow-md transition-all group"
                          >
                             <span className="font-bold text-gray-800">{link}</span>
                             <ExternalLink className="w-4 h-4 text-gray-400 group-hover:text-green-600" />
                          </a>
                      ))}
                    </div>
                  </div>
                </div>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};

const SellerCard: React.FC<{ seller: Seller; onClick: () => void }> = ({ seller, onClick }) => {
  return (
    <button 
      onClick={onClick}
      className="w-full text-left bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-lg transition-all duration-300 group hover:-translate-y-1"
    >
       <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-4">
            <div className="relative">
              <img src={seller.avatarUrl} alt={seller.username} className="w-14 h-14 rounded-full object-cover border-2 border-white shadow-sm" />
              <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 border-2 border-white rounded-full"></div>
            </div>
            <div>
               <h3 className="font-bold text-lg text-gray-900 leading-tight group-hover:text-green-700 transition-colors">{seller.username}</h3>
               <p className="text-xs text-green-600 font-medium mt-0.5">Profilo Verificato</p>
            </div>
          </div>
       </div>
       
       <div className="mb-4">
         <div className="flex flex-wrap gap-1.5">
            {seller.categories.slice(0, 3).map(cat => (
               <span key={cat} className="text-[10px] uppercase font-bold tracking-wider px-2.5 py-1 bg-gray-50 text-gray-600 rounded-md border border-gray-100">
                  {cat}
               </span>
            ))}
            {seller.categories.length > 3 && (
                <span className="text-[10px] font-bold text-gray-400">+{seller.categories.length - 3}</span>
            )}
         </div>
       </div>
       
       <div className="space-y-2 pt-4 border-t border-gray-50 flex justify-between items-center">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
             Dettagli Profilo
          </p>
          <div className="bg-gray-100 text-gray-500 p-2 rounded-full group-hover:bg-green-100 group-hover:text-green-700 transition-colors">
             <ArrowLeft className="w-4 h-4 rotate-180" />
          </div>
       </div>
    </button>
  );
};

export default Ecommerce;

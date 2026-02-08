import React, { useState, useEffect } from 'react';
import { MapPin, ShoppingBag, Filter, ArrowLeft, X, ExternalLink, Info, Tag, PlusCircle, Loader2, Globe, User } from 'lucide-react';
import { Seller } from '../types';
import { Link } from 'react-router-dom';
import * as ecommerceService from '../services/ecommerceService';

const DB_CATEGORIES = [
  "cura della casa e della persona",
  "alimenti",
  "vestiario"
];

const DB_ZONES = [
  "Meano",
  "Gardolo",
  "Argentario",
  "Centro Storico Piedicastello",
  "Bondone",
  "San Giuseppe Santa Chiara",
  "Sardagna",
  "Povo",
  "Oltrefersina",
  "Ravina-Romagnano",
  "Villazzano",
  "Mattarello"
];

interface EcommerceProps {
  sellers: Seller[];
}

const Ecommerce: React.FC<EcommerceProps> = () => {
  const [dbSellers, setDbSellers] = useState<Seller[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [selectedZone, setSelectedZone] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('Tutte');
  const [selectedSeller, setSelectedSeller] = useState<Seller | null>(null);
  const [modalImgError, setModalImgError] = useState(false);

  useEffect(() => {
    if (selectedSeller) {
      setModalImgError(false);
    }
  }, [selectedSeller]);

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        const data = await ecommerceService.fetchSellers();
        setDbSellers(data);
      } catch (err) {
        console.error("Errore nel caricamento dei venditori e-commerce");
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, []);

  const filteredSellers = dbSellers.filter(seller => {
    const matchesZone = selectedZone === 'TUTTE' 
      ? true 
      : (selectedZone ? seller.zoneIds.includes(selectedZone) : true);

    const matchesCategory = selectedCategory === 'Tutte' || seller.categories.includes(selectedCategory);
    
    return matchesZone && matchesCategory;
  });

  const categories = ['Tutte', ...DB_CATEGORIES];
  const activeZoneName = selectedZone === 'TUTTE' ? "Tutte le zone" : selectedZone;

  const handleGoBack = () => {
    setSelectedZone(null);
    setSelectedCategory('Tutte');
  };

  const getZoneDisplay = (zones: string[]) => {
    return zones.join(', ');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
        <Loader2 className="w-12 h-12 text-green-600 animate-spin mb-4" />
        <p className="font-bold text-gray-700 italic">Connessione ai venditori e-commerce in corso...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex flex-col md:flex-row justify-between items-center mb-4 gap-4">
          <div className="text-center md:text-left">
             <h1 className="text-3xl md:text-4xl font-bold text-gray-900">Venditori E-Commerce</h1>
             <p className="text-gray-500 max-w-2xl">
               Scopri i venditori locali attivi nel tuo quartiere
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
          <div className="animate-in fade-in zoom-in duration-300">
             <h2 className="text-xl font-semibold text-center text-gray-700 mb-8">
               Seleziona una zona per esplorare
             </h2>
             
             <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-8 max-w-5xl mx-auto">
                <button
                    onClick={() => setSelectedZone('TUTTE')}
                    className="group relative flex flex-col items-center justify-center p-10 rounded-3xl bg-green-600 border border-green-500 shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
                >
                    <div className="w-20 h-20 rounded-full bg-white/20 flex items-center justify-center mb-6 group-hover:bg-white/30 transition-colors">
                    <Globe className="w-10 h-10 text-white" />
                    </div>
                    <span className="text-xl font-bold text-white">
                    Tutte le zone
                    </span>
                    <div className="mt-2 text-sm text-green-100 font-medium">
                    {dbSellers.length} venditori totali
                    </div>
                </button>
                {DB_ZONES.map((zoneName) => {
                    const sellersInZone = dbSellers.filter(s => s.zoneIds.includes(zoneName)).length;
                    
                    return (
                        <button
                        key={zoneName}
                        onClick={() => setSelectedZone(zoneName)}
                        className={`group relative flex flex-col items-center justify-center p-10 rounded-3xl border shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1
                            ${sellersInZone > 0 ? 'bg-white border-gray-100' : 'bg-gray-50 border-gray-200 opacity-80 hover:opacity-100'}`}
                        >
                        <div className={`w-20 h-20 rounded-full flex items-center justify-center mb-6 transition-colors
                            ${sellersInZone > 0 ? 'bg-green-50 group-hover:bg-green-100' : 'bg-gray-200'}`}>
                            <MapPin className={`w-10 h-10 ${sellersInZone > 0 ? 'text-green-600' : 'text-gray-400'}`} />
                        </div>
                        <span className={`text-xl font-bold transition-colors ${sellersInZone > 0 ? 'text-gray-800 group-hover:text-green-800' : 'text-gray-500'}`}>
                            {zoneName}
                        </span>
                        <div className="mt-2 text-sm text-gray-400 font-medium">
                            {sellersInZone} venditori attivi
                        </div>
                        </button>
                    );
                })}
             </div>
          </div>
        ) : (
          <div className="animate-in slide-in-from-right duration-300">
            
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
               <button 
                 onClick={handleGoBack}
                 className="flex items-center gap-2 text-gray-600 hover:text-green-700 font-semibold transition-colors px-3 py-2 rounded-lg hover:bg-gray-100"
               >
                 <ArrowLeft className="w-5 h-5" />
                 Torna alle zone
               </button>
               <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                 {selectedZone === 'TUTTE' ? <Globe className="w-6 h-6 text-green-600"/> : <MapPin className="w-6 h-6 text-green-600" />}
                 {activeZoneName}
               </h2>
            </div>
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-200 mb-8 sticky top-20 z-10">
              <div className="flex items-center gap-3 mb-3 md:mb-0">
                 <Filter className="w-5 h-5 text-gray-400" />
                 <span className="text-sm font-semibold text-gray-500 mr-2">Filtra per:</span>
                 
                 <div className="flex overflow-x-auto gap-2 w-full no-scrollbar pb-1">
                    {categories.map((cat) => (
                      <button
                        key={cat}
                        onClick={() => setSelectedCategory(cat)}
                        className={`px-4 py-2 rounded-lg text-sm font-semibold whitespace-nowrap transition-all flex-shrink-0
                          ${selectedCategory === cat 
                            ? 'bg-green-600 text-white shadow-md' 
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                      >
                        {cat.charAt(0).toUpperCase() + cat.slice(1)}
                      </button>
                    ))}
                 </div>
              </div>
            </div>

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
                  <ShoppingBag className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-1">Nessun venditore qui</h3>
                <p className="text-gray-500 text-sm">
                  Non ci sono ancora venditori attivi a <span className="font-bold">{activeZoneName}</span> per la categoria "{selectedCategory}".
                </p>
                <Link to="/profilo" className="text-green-600 hover:underline mt-2 inline-block text-sm font-semibold">
                    Diventa il primo venditore di questa zona!
                </Link>
              </div>
            )}
          </div>
        )}

      </div>

      {selectedSeller && (
        <div className="fixed inset-0 z-[3000] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-[30px] shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200 relative max-h-[90vh] overflow-y-auto">
              
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
                     {(!selectedSeller.avatarUrl || modalImgError) ? (
                        <div className="w-32 h-32 rounded-full border-4 border-white shadow-lg bg-gray-100 flex items-center justify-center">
                           <User className="w-16 h-16 text-gray-400" />
                        </div>
                     ) : (
                        <img 
                          src={selectedSeller.avatarUrl} 
                          alt={selectedSeller.username}
                          onError={() => setModalImgError(true)} 
                          className="w-32 h-32 rounded-full object-cover border-4 border-white shadow-lg bg-white" 
                        />
                     )}
                     
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
                          <MapPin className="w-3 h-3"/> Zone: {getZoneDisplay(selectedSeller.zoneIds)}
                       </p>
                     </div>
                   </div>

                   <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 text-gray-600 text-sm leading-relaxed">
                      <div className="flex items-center gap-2 mb-2 text-gray-900 font-bold text-xs uppercase tracking-wider">
                         <Info className="w-4 h-4 text-green-600" /> Dettagli
                      </div>
                      {selectedSeller.bio || "Informazioni non disponibili."}
                   </div>

                   <div>
                     <h3 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
                       <Tag className="w-4 h-4 text-gray-400" /> Categorie prodotti
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
                       <ShoppingBag className="w-4 h-4 text-gray-400" /> Link esterni
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
                              <span className="font-bold text-gray-800 truncate text-xs">{link}</span>
                              <ExternalLink className="w-4 h-4 text-gray-400 group-hover:text-green-600 flex-shrink-0" />
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

const SellerCard: React.FC<{ 
    seller: Seller; 
    onClick: () => void;
}> = ({ seller, onClick }) => {

  const [imgError, setImgError] = useState(false);

  return (
    <button 
      onClick={onClick}
      className="w-full text-left bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-lg transition-all duration-300 group hover:-translate-y-1"
    >
       <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-4">
            <div className="relative">
              {(!seller.avatarUrl || imgError) ? (
                 <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center border-2 border-white shadow-sm">
                   <User className="w-8 h-8 text-gray-400" />
                 </div>
              ) : (
                 <img 
                   src={seller.avatarUrl} 
                   alt={seller.username}
                   onError={() => setImgError(true)}
                   className="w-14 h-14 rounded-full object-cover border-2 border-white shadow-sm" 
                 />
              )}

              <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 border-2 border-white rounded-full"></div>
            </div>
            <div>
               <h3 className="font-bold text-lg text-gray-900 leading-tight group-hover:text-green-700 transition-colors">{seller.username}</h3>
               <p className="text-xs text-green-600 font-medium mt-0.5">Profilo verificato</p>
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
             Dettagli profilo
          </p>
          <div className="bg-gray-100 text-gray-500 p-2 rounded-full group-hover:bg-green-100 group-hover:text-green-700 transition-colors">
             <ArrowLeft className="w-4 h-4 rotate-180" />
          </div>
       </div>
    </button>
  );
};

export default Ecommerce;
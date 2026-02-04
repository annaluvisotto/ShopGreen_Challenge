import React, { useState, useEffect, useRef } from 'react';
import { Shop, ShopCategory, ShopStatus, UserRole, Coordinates } from '../types';
import { X, Camera, Image as ImageIcon, Trash2, Clock, MapPin, Globe, Layout, Type, Crosshair, CheckSquare, Square } from 'lucide-react';

interface AddShopModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (shop: Shop) => void;
  userRole: UserRole;
  currentMapCenter: Coordinates;
  existingShops: Shop[]; 
  currentUserId?: string | null;
  initialData?: {
    name?: string;
    ownerId?: string;
  };
}

const DAYS = ['Lunedì', 'Martedì', 'Mercoledì', 'Giovedì', 'Venerdì', 'Sabato', 'Domenica'];

const formatCategoryLabel = (cat: string) => {
  if (cat === 'cura della casa e della persona') return 'Cura Casa & Persona';
  return cat.charAt(0).toUpperCase() + cat.slice(1);
};

const AddShopModal: React.FC<AddShopModalProps> = ({ isOpen, onClose, onSubmit, userRole, currentMapCenter, existingShops, initialData, currentUserId }) => {
  const [activeTab, setActiveTab] = useState<'report' | 'claim'>('report');
  const [isAlreadyPresent, setIsAlreadyPresent] = useState(false);
  const [selectedExistingShopId, setSelectedExistingShopId] = useState<string | null>(null);

  // Dati Base
  const [name, setName] = useState('');
  const [category, setCategory] = useState<ShopCategory>(ShopCategory.OTHER);
  const [ownerId, setOwnerId] = useState('');
  
  // Links
  const [website, setWebsite] = useState('');
  const [googleMapsLink, setGoogleMapsLink] = useState('');
  const [iosMapsLink, setIosMapsLink] = useState('');

  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- NUOVA GESTIONE ORARI DOPPI ---
  const [structuredHours, setStructuredHours] = useState(
    DAYS.map(day => ({ 
        day, 
        // Mattina
        openMorning: '09:00', 
        closeMorning: '13:00',
        // Pomeriggio
        openAfternoon: '15:30', 
        closeAfternoon: '19:30', 
        
        isClosed: day === 'Domenica' 
    }))
  );

  const [lat, setLat] = useState<string | number>(currentMapCenter.lat);
  const [lng, setLng] = useState<string | number>(currentMapCenter.lng);

  useEffect(() => {
    if (isOpen) {
      if (!isAlreadyPresent) {
        setLat(currentMapCenter.lat);
        setLng(currentMapCenter.lng);
      }
      if (initialData) {
        if (initialData.name) setName(initialData.name);
        if (initialData.ownerId) setOwnerId(initialData.ownerId);
      }
    }
  }, [isOpen, currentMapCenter, initialData]);

  // Gestione Input Orari (Generico per 4 campi)
  const updateHour = (index: number, field: 'openMorning' | 'closeMorning' | 'openAfternoon' | 'closeAfternoon', value: string) => {
      const newHours = [...structuredHours];
      newHours[index] = { ...newHours[index], [field]: value };
      setStructuredHours(newHours);
  };

  const toggleClosed = (index: number) => {
      const newHours = [...structuredHours];
      newHours[index] = { ...newHours[index], isClosed: !newHours[index].isClosed };
      setStructuredHours(newHours);
  };

  const handleExistingShopSelect = (shopId: string) => {
    const shop = existingShops.find(s => s.id === shopId);
    if (shop) {
        setSelectedExistingShopId(shop.id);
        setName(shop.name);
        setCategory(shop.categories && shop.categories.length > 0 ? shop.categories[0] : ShopCategory.OTHER);
        setLat(shop.coordinates.lat);
        setLng(shop.coordinates.lng);
        setWebsite(shop.website || '');
        setGoogleMapsLink(shop.googleMapsLink || '');
        setIosMapsLink(shop.iosMapsLink || '');
    } else {
        setSelectedExistingShopId(null);
        setName('');
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setPreviewImage(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const triggerFileInput = () => fileInputRef.current?.click();
  const removeImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setPreviewImage(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // 1. Validazione Licenza (invariata)
    if (activeTab === 'claim' && !previewImage) {
        alert("Per segnalare la propria attività è obbligatorio caricare la licenza di vendita");
        return;
    }
    
    // 2. Logica Proprietario (invariata)
    let finalOwnerId = undefined;
    if (activeTab === 'claim' && currentUserId) {
        finalOwnerId = currentUserId;
    } 
    else if (ownerId.trim() !== '') {
        finalOwnerId = ownerId.trim();
    }

    // 3. Formattazione Orari (invariata)
    const formattedHoursString = structuredHours.map(h => {
        if (h.isClosed) return `${h.day}: Chiuso`;
        return `${h.day}: ${h.openMorning}-${h.closeMorning} / ${h.openAfternoon}-${h.closeAfternoon}`;
    }).join('\n');

    // --- 4. LOGICA ZERO DUPLICATI (NUOVA) ---
    // Stiamo facendo un aggiornamento se: siamo in tab 'claim', l'utente ha spuntato "già presente" E abbiamo selezionato un ID valido
    const isUpdate = activeTab === 'claim' && isAlreadyPresent && !!selectedExistingShopId;

    // Se è un aggiornamento, usiamo l'ID esistente. Altrimenti ne creiamo uno nuovo.
    const finalId = isUpdate ? selectedExistingShopId! : Date.now().toString();

    const newShop: Shop = {
      id: finalId, // <--- USA L'ID CALCOLATO QUI SOPRA
      name: name,
      hours: formattedHoursString, 
      categories: [category],
      coordinates: { lat: Number(lat), lng: Number(lng) },
      status: ShopStatus.UNVERIFIED, 
      sustainabilityScore: 0,
      website: website,
      googleMapsLink: googleMapsLink,
      iosMapsLink: iosMapsLink,
      imageUrl: previewImage || '',
      votes: {},
      reviews: [],
      ownerId: finalOwnerId,
      // Se è un update, la descrizione è meno importante perché l'operatore sa già che è una rivendicazione dal flag proprietarioInAttesa
      description: activeTab === 'claim' ? `Richiesta rivendicazione da utente: ${currentUserId}` : (name ? '' : 'Nuova attività inserita')
    };

    // 5. INVIO AL GENITORE
    // Passiamo 'isExistingUpdate' così Home.tsx sa se usare createNegozio (POST) o updateNegozio (PUT)
    onSubmit({ 
        ...newShop, 
        rawHours: structuredHours,
        isExistingUpdate: isUpdate // <--- FONDAMENTALE
    } as any); 
    
    handleClose();
  };

  const handleClose = () => {
    setName('');
    setCategory(ShopCategory.OTHER);
    setWebsite('');
    setGoogleMapsLink('');
    setIosMapsLink('');
    setPreviewImage(null);
    setOwnerId('');
    setIsAlreadyPresent(false);
    setSelectedExistingShopId(null);
    // Reset
    setStructuredHours(DAYS.map(day => ({ 
        day, openMorning: '09:00', closeMorning: '13:00', openAfternoon: '15:30', closeAfternoon: '19:30', isClosed: day === 'Domenica' 
    })));
    onClose();
  };

  const renderImageUpload = (label: string, isLicense = false) => (
    <div className="space-y-2">
        <label className="text-gray-600 font-bold text-sm ml-4">{label}</label>
        <input type="file" accept="image/*" ref={fileInputRef} onChange={handleImageUpload} className="hidden" />
        {!previewImage ? (
            <div onClick={triggerFileInput} className={`w-full ${isLicense ? 'h-32' : 'h-48'} bg-gray-100 rounded-[20px] border-2 border-dashed border-gray-300 flex flex-col items-center justify-center text-gray-500 cursor-pointer hover:bg-gray-200 transition-all group`}>
                <div className="bg-white p-3 rounded-full shadow-sm mb-2 group-hover:scale-110 transition-transform">
                    <Camera className="w-6 h-6 text-gray-400" />
                </div>
                <span className="font-medium text-sm">Clicca per caricare una foto</span>
            </div>
        ) : (
            <div className={`relative w-full ${isLicense ? 'h-32' : 'h-56'} rounded-[20px] overflow-hidden shadow-md group`}>
                <img src={previewImage} alt="Preview" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
                    <button type="button" onClick={triggerFileInput} className="p-2 bg-white/20 backdrop-blur-md rounded-full text-white hover:bg-white/40 transition-colors"><ImageIcon className="w-5 h-5" /></button>
                    <button type="button" onClick={removeImage} className="p-2 bg-red-500/80 backdrop-blur-md rounded-full text-white hover:bg-red-600/90 transition-colors"><Trash2 className="w-5 h-5" /></button>
                </div>
            </div>
        )}
    </div>
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[3000] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-[30px] shadow-2xl w-full max-w-2xl h-[90vh] flex flex-col overflow-hidden relative border border-gray-100 animate-in fade-in zoom-in duration-300">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-white sticky top-0 z-10">
            <h2 className="text-xl font-bold text-gray-800">
                {initialData ? 'Crea Nuova Attività (Da Segnalazione)' : 'Nuova Segnalazione'}
            </h2>
            <button onClick={handleClose} className="p-2 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors">
                <X className="w-5 h-5 text-gray-500" />
            </button>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
            {!initialData && (
                <div className="flex bg-gray-100 rounded-full p-1 mb-6">
                    <button onClick={() => setActiveTab('report')} className={`flex-1 py-2.5 text-center rounded-full font-bold text-sm transition-all duration-300 ${activeTab === 'report' ? 'bg-[#7dad57] text-white shadow-md' : 'text-gray-500 hover:text-gray-700'}`}>Segnala nuova attività</button>
                    <button onClick={() => setActiveTab('claim')} className={`flex-1 py-2.5 text-center rounded-full font-bold text-sm transition-all duration-300 ${activeTab === 'claim' ? 'bg-[#7dad57] text-white shadow-md' : 'text-gray-500 hover:text-gray-700'}`}>Segnala propria attività</button>
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
                {renderImageUpload(activeTab === 'claim' ? 'Carica Licenza Commerciale' : 'Foto del Negozio', activeTab === 'claim')}

                {/* (Checkbox Claim - Codice esistente omesso per brevità, non cambia) */}
                {activeTab === 'claim' && (
                  <div className="bg-green-50 p-4 rounded-2xl border border-green-100">
                    <button type="button" onClick={() => setIsAlreadyPresent(!isAlreadyPresent)} className="flex items-center gap-3 w-full text-left">
                       {isAlreadyPresent ? <CheckSquare className="w-6 h-6 text-green-600" /> : <Square className="w-6 h-6 text-gray-400" />}
                       <div>
                          <p className="font-bold text-gray-800 text-sm">L'attività è già presente nel sistema?</p>
                          <p className="text-xs text-gray-500">Collega la licenza ad un segnaposto esistente.</p>
                       </div>
                    </button>
                  </div>
                )}

                <div className="space-y-4">
                    <div className="space-y-1">
    <div className="flex items-center gap-2 ml-4 mb-1">
        <Type className="w-4 h-4 text-gray-400" />
        <label className="text-gray-600 font-bold text-sm">Nome Attività</label>
    </div>
    
    {activeTab === 'claim' && isAlreadyPresent ? (
        <div className="relative">
            {/* CONTROLLO LISTA VUOTA PER EVITARE MENU ROTTI */}
            {existingShops.length === 0 ? (
                <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-2xl text-yellow-800 text-sm">
                    ⚠️ Nessun negozio caricato. Riprova a ricaricare la pagina.
                </div>
            ) : (
                <>
                    <select 
                        value={selectedExistingShopId || ""} 
                        onChange={(e) => handleExistingShopSelect(e.target.value)} 
                        className="w-full bg-green-50 text-gray-800 font-medium px-5 py-3 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#7dad57] appearance-none border border-green-200 cursor-pointer"
                    >
                        <option value="">-- Seleziona la tua Attività --</option>
                        {existingShops.map(s => (
                            <option key={s.id} value={s.id}>
                                {s.name} ({s.address || "Nessun indirizzo"})
                            </option>
                        ))}
                    </select>
                    {/* Icona freccina */}
                    <div className="absolute inset-y-0 right-0 flex items-center px-4 pointer-events-none text-gray-500">
                        <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20"><path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" /></svg>
                    </div>
                </>
            )}
        </div>
    ) : (
        <input 
            type="text" 
            required 
            placeholder="Es. EcoMarket Trento" 
            value={name} 
            onChange={(e) => setName(e.target.value)} 
            className="w-full bg-gray-100 text-gray-800 px-5 py-3 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#7dad57]" 
        />
    )}
</div>

                    <div className="space-y-1">
   <div className="flex items-center gap-2 ml-4 mb-1">
      <Layout className="w-4 h-4 text-gray-400" />
      <label className="text-gray-600 font-bold text-sm">Categoria</label>
   </div>
   <div className="relative">
       <select 
           value={category} 
           onChange={(e) => setCategory(e.target.value as ShopCategory)} 
           className="w-full bg-gray-100 text-gray-800 px-5 py-3 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#7dad57] appearance-none cursor-pointer capitalize"
       >
           {}
           {Object.values(ShopCategory).map(cat => (
               <option key={cat} value={cat}>{formatCategoryLabel(cat)}</option>
           ))}
       </select>
       {}
   </div>
</div>

                    <div className="space-y-1">
                        <div className="flex items-center gap-2 ml-4 mb-1"><MapPin className="w-4 h-4 text-gray-400" /><label className="text-gray-600 font-bold text-sm">Indirizzo</label></div>
                    </div>

                    {/* Coordinate */}
                    <div className="space-y-1">
                        <div className="flex items-center gap-2 ml-4 mb-1"><Crosshair className="w-4 h-4 text-gray-400" /><label className="text-gray-600 font-bold text-sm">Coordinate</label></div>
                        <div className="flex gap-3">
                            <input type="number" step="any" placeholder="Lat" value={lat} onChange={(e) => setLat(e.target.value)} className="w-full bg-gray-100 text-gray-800 px-5 py-3 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#7dad57]" />
                            <input type="number" step="any" placeholder="Lng" value={lng} onChange={(e) => setLng(e.target.value)} className="w-full bg-gray-100 text-gray-800 px-5 py-3 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#7dad57]" />
                        </div>
                    </div>

                    {/* --- NUOVA SEZIONE ORARI (MATTINA + POMERIGGIO) --- */}
                    <div className="bg-gray-50 rounded-[20px] p-5 border border-gray-100">
                        <div className="flex items-center gap-2 mb-3">
                           <Clock className="w-4 h-4 text-gray-400" />
                           <label className="text-gray-600 font-bold text-sm">Orari (Mattina / Pomeriggio)</label>
                        </div>
                        
                        <div className="space-y-3">
                            {structuredHours.map((item, index) => (
                                <div key={item.day} className="flex flex-col md:flex-row md:items-center justify-between gap-2 text-sm bg-white p-3 rounded-xl border border-gray-100 shadow-sm">
                                    <div className="flex items-center justify-between w-full md:w-auto">
                                        <span className="w-20 font-bold text-gray-700">{item.day.slice(0,3)}</span>
                                        <button
                                            type="button"
                                            onClick={() => toggleClosed(index)}
                                            className={`md:hidden px-3 py-1.5 rounded-lg text-xs font-bold transition-colors border ${item.isClosed ? 'bg-red-50 text-red-600 border-red-100' : 'bg-green-50 text-green-700 border-green-100'}`}
                                        >
                                            {item.isClosed ? 'Chiuso' : 'Aperto'}
                                        </button>
                                    </div>
                                    
                                    {!item.isClosed ? (
                                        <div className="flex flex-col gap-2 w-full">
                                            {/* RIGA MATTINA */}
                                            <div className="flex items-center gap-2">
                                                <span className="text-[10px] text-gray-400 font-bold w-4">AM</span>
                                                <input type="time" value={item.openMorning} onChange={(e) => updateHour(index, 'openMorning', e.target.value)} className="bg-gray-100 border border-gray-200 rounded-lg px-2 py-1 text-xs focus:ring-2 focus:ring-[#7dad57] outline-none flex-1" />
                                                <span className="text-gray-400">-</span>
                                                <input type="time" value={item.closeMorning} onChange={(e) => updateHour(index, 'closeMorning', e.target.value)} className="bg-gray-100 border border-gray-200 rounded-lg px-2 py-1 text-xs focus:ring-2 focus:ring-[#7dad57] outline-none flex-1" />
                                            </div>
                                            {/* RIGA POMERIGGIO */}
                                            <div className="flex items-center gap-2">
                                                <span className="text-[10px] text-gray-400 font-bold w-4">PM</span>
                                                <input type="time" value={item.openAfternoon} onChange={(e) => updateHour(index, 'openAfternoon', e.target.value)} className="bg-gray-100 border border-gray-200 rounded-lg px-2 py-1 text-xs focus:ring-2 focus:ring-[#7dad57] outline-none flex-1" />
                                                <span className="text-gray-400">-</span>
                                                <input type="time" value={item.closeAfternoon} onChange={(e) => updateHour(index, 'closeAfternoon', e.target.value)} className="bg-gray-100 border border-gray-200 rounded-lg px-2 py-1 text-xs focus:ring-2 focus:ring-[#7dad57] outline-none flex-1" />
                                            </div>
                                        </div>
                                    ) : (
                                        <span className="flex-1 text-center text-gray-400 italic text-xs py-2">Giorno di chiusura</span>
                                    )}

                                    <button
                                        type="button"
                                        onClick={() => toggleClosed(index)}
                                        className={`hidden md:block px-3 py-1.5 rounded-lg text-xs font-bold transition-colors border ${item.isClosed ? 'bg-red-50 text-red-600 border-red-100' : 'bg-green-50 text-green-700 border-green-100'}`}
                                    >
                                        {item.isClosed ? 'Chiuso' : 'Aperto'}
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* (Links - Codice esistente omesso) */}
                    <div className="space-y-1">
                        <div className="flex items-center gap-2 ml-4 mb-1"><Globe className="w-4 h-4 text-gray-400" /><label className="text-gray-600 font-bold text-sm">Link Utili</label></div>
                        <input type="url" placeholder="Sito Web" value={website} onChange={(e) => setWebsite(e.target.value)} className="w-full bg-gray-100 text-gray-800 px-5 py-3 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-[#7dad57] mb-3" />
                        <div className="grid grid-cols-2 gap-3">
                            <input type="url" placeholder="Google Maps" value={googleMapsLink} onChange={(e) => setGoogleMapsLink(e.target.value)} className="w-full bg-gray-100 text-gray-800 px-5 py-3 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-[#7dad57]" />
                            <input type="url" placeholder="Apple Maps" value={iosMapsLink} onChange={(e) => setIosMapsLink(e.target.value)} className="w-full bg-gray-100 text-gray-800 px-5 py-3 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-[#7dad57]" />
                        </div>
                    </div>
                </div>

                <div className="pt-4 pb-2">
                    <button type="submit" className="w-full bg-[#d9e8cd] hover:bg-[#c4dbb3] text-black font-bold text-lg py-4 rounded-2xl shadow-sm transition-all transform active:scale-95">
                      {initialData ? 'Crea Scheda Attività' : (activeTab === 'report' ? 'Invia Segnalazione' : 'Segnala propria attività')}
                    </button>
                </div>
            </form>
        </div>
      </div>
    </div>
  );
};

export default AddShopModal;
//versione che utilizza i mock

/**import React, { useState, useEffect } from 'react';
import { Shop, ShopCategory, UserRole } from '../types';
import { X, Save, UserPlus, AlertTriangle, Loader2 } from 'lucide-react';

interface EditShopModalProps {
  shop: Shop | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (updatedShop: Shop) => void;
  userRole: UserRole;
}

const EditShopModal: React.FC<EditShopModalProps> = ({ shop, isOpen, onClose, onUpdate, userRole }) => {
  const [formData, setFormData] = useState<Partial<Shop>>({});
  const [newOwner, setNewOwner] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (shop) {
      setFormData({ ...shop });
      setNewOwner(shop.ownerId || '');
      setError(null);
    }
  }, [shop, isOpen]);

  if (!isOpen || !shop || userRole !== UserRole.OPERATOR) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSaving(true);

    // Eccezione 2: Validazione Dati
    if (!formData.name || !formData.address) {
       setError("Nome e Indirizzo sono obbligatori.");
       setIsSaving(false);
       return;
    }

    // Simulazione ritardo di rete e possibile errore database (Eccezione 1)
    setTimeout(() => {
       // Simuliamo un errore random (10% di probabilità)
       const randomError = Math.random() < 0.1;
       
       if (randomError) {
         setError("Errore di connessione al database. Riprova più tardi.");
         setIsSaving(false);
       } else {
         const updatedShop = {
           ...shop,
           ...formData,
           ownerId: newOwner.trim() !== '' ? newOwner.trim() : undefined
         };
         
         onUpdate(updatedShop as Shop);
         
         if (newOwner.trim() && newOwner !== shop.ownerId) {
            alert(`Permessi aggiornati: L'utente "${newOwner}" è ora associato come gestore di "${updatedShop.name}".`);
         }
         
         setIsSaving(false);
         onClose();
       }
    }, 1000);
  };

  return (
    <div className="fixed inset-0 z-[3000] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in duration-200">
        
        {}
        <div className="sticky top-0 bg-white px-6 py-4 border-b border-gray-100 flex justify-between items-center z-10">
          <div className="flex items-center gap-2">
            <div className="bg-orange-100 p-2 rounded-lg">
               <UserPlus className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Modifica Attività</h2>
              <p className="text-xs text-gray-500">Area Operatore</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {}
        {error && (
          <div className="mx-6 mt-4 p-3 bg-red-50 text-red-700 rounded-lg flex items-center gap-2 text-sm border border-red-200">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            {error}
          </div>
        )}

        {}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700">Nome Attività</label>
              <input 
                type="text" 
                className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 outline-none"
                value={formData.name || ''}
                onChange={e => setFormData({...formData, name: e.target.value})}
              />
            </div>
            <div className="space-y-1">
               <label className="text-sm font-medium text-gray-700">Categoria</label>
               <select 
                  className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 outline-none bg-white"
                  value={formData.category}
                  onChange={e => setFormData({...formData, category: e.target.value as ShopCategory})}
               >
                  {Object.values(ShopCategory).map(cat => (
                     <option key={cat} value={cat}>{cat}</option>
                  ))}
               </select>
            </div>
          </div>

          <div className="space-y-1">
             <label className="text-sm font-medium text-gray-700">Indirizzo</label>
             <input 
               type="text" 
               className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 outline-none"
               value={formData.address || ''}
               onChange={e => setFormData({...formData, address: e.target.value})}
             />
          </div>

          <div className="space-y-1">
             <label className="text-sm font-medium text-gray-700">Orari</label>
             <input 
               type="text" 
               className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 outline-none"
               value={formData.hours || ''}
               onChange={e => setFormData({...formData, hours: e.target.value})}
             />
          </div>

          <div className="space-y-1">
             <label className="text-sm font-medium text-gray-700">Descrizione</label>
             <textarea 
               rows={3}
               className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 outline-none"
               value={formData.description || ''}
               onChange={e => setFormData({...formData, description: e.target.value})}
             />
          </div>

          {}
          <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
             <h3 className="font-bold text-blue-900 text-sm mb-3 flex items-center gap-2">
               <UserPlus className="w-4 h-4"/> Gestione Venditore
             </h3>
             <div className="space-y-1">
                <label className="text-xs font-semibold text-blue-800">Associa Username Utente</label>
                <div className="flex gap-2">
                   <input 
                     type="text" 
                     placeholder="Es. mario.rossi"
                     className="flex-1 border border-blue-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
                     value={newOwner}
                     onChange={e => setNewOwner(e.target.value)}
                   />
                </div>
                <p className="text-[10px] text-blue-600 mt-1">
                   Inserendo uno username, il sistema cambierà i permessi di quell'utente permettendogli di gestire questa attività.
                </p>
             </div>
          </div>

          {}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-gray-100">
             <div className="space-y-1">
                <label className="text-xs font-bold text-gray-500">Sito Web</label>
                <input 
                   type="url" 
                   className="w-full border rounded-lg px-3 py-2 text-sm"
                   value={formData.website || ''}
                   onChange={e => setFormData({...formData, website: e.target.value})}
                />
             </div>
             <div className="space-y-1">
                <label className="text-xs font-bold text-gray-500">Immagine URL</label>
                <input 
                   type="url" 
                   className="w-full border rounded-lg px-3 py-2 text-sm"
                   value={formData.imageUrl || ''}
                   onChange={e => setFormData({...formData, imageUrl: e.target.value})}
                />
             </div>
          </div>

          {}
          <div className="flex gap-3 pt-4 border-t border-gray-100">
             <button 
               type="button" 
               onClick={onClose}
               disabled={isSaving}
               className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors disabled:opacity-50"
             >
               Annulla
             </button>
             <button 
               type="submit" 
               disabled={isSaving}
               className="flex-1 px-4 py-2 bg-green-600 rounded-lg text-white font-medium hover:bg-green-700 transition-colors shadow-sm flex items-center justify-center gap-2 disabled:opacity-70"
             >
               {isSaving ? (
                 <>
                   <Loader2 className="w-4 h-4 animate-spin" /> Salvataggio...
                 </>
               ) : (
                 <>
                   <Save className="w-4 h-4" /> Salva Modifiche
                 </>
               )}
             </button>
          </div>

        </form>
      </div>
    </div>
  );
};

export default EditShopModal;**/


//versione che utilizza i services e si collega al backend
import React, { useState, useEffect } from 'react';
import { Shop, ShopCategory, UserRole } from '../types';
import { X, Save, UserPlus, AlertTriangle, Loader2, Clock } from 'lucide-react';

interface EditShopModalProps {
  shop: Shop | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (updatedShop: Shop) => Promise<void>;
  userRole: UserRole;
  currentUserId?: string | null;
}

const DAYS = ['Lunedì', 'Martedì', 'Mercoledì', 'Giovedì', 'Venerdì', 'Sabato', 'Domenica'];

const EditShopModal: React.FC<EditShopModalProps> = ({ shop, isOpen, onClose, onUpdate, userRole, currentUserId }) => {
  const [formData, setFormData] = useState<Partial<Shop>>({});
  const [newOwner, setNewOwner] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Stato per gli orari strutturati (Mattina/Pomeriggio)
  const [structuredHours, setStructuredHours] = useState(
    DAYS.map(day => ({ 
        day, 
        openMorning: '09:00', closeMorning: '13:00',
        openAfternoon: '15:30', closeAfternoon: '19:30', 
        isClosed: day === 'Domenica' 
    }))
  );

  const formatCategoryLabel = (cat: string) => {
    if (cat === 'cura della casa e della persona') return 'Cura Casa & Persona';
    return cat.charAt(0).toUpperCase() + cat.slice(1);
  };

  // Funzione per convertire dal formato Backend (rawHours) al formato UI (structuredHours)
  const parseBackendHoursToUI = (rawHours: any) => {
     if (!rawHours) return; // Se non ci sono dati raw, usiamo il default

     const dayMapReverse: { [key: string]: string } = {
        'lunedi': 'Lunedì', 'martedi': 'Martedì', 'mercoledi': 'Mercoledì',
        'giovedi': 'Giovedì', 'venerdi': 'Venerdì', 'sabato': 'Sabato', 'domenica': 'Domenica'
     };

     const newStructure = DAYS.map(day => {
         // Troviamo la chiave backend corrispondente (es. "Lunedì" -> "lunedi")
         const dbKey = Object.keys(dayMapReverse).find(key => dayMapReverse[key] === day);
         const dayData = dbKey ? rawHours[dbKey] : null;

         if (!dayData || dayData.chiuso) {
             return { 
                 day, isClosed: true, 
                 openMorning: '09:00', closeMorning: '13:00', 
                 openAfternoon: '15:30', closeAfternoon: '19:30' 
             };
         }

         // Se aperto, prendiamo gli slot
         const slots = dayData.slot || [];
         return {
             day,
             isClosed: false,
             // Primo slot (Mattina)
             openMorning: slots[0]?.apertura || '09:00',
             closeMorning: slots[0]?.chiusura || '13:00',
             // Secondo slot (Pomeriggio) - se esiste
             openAfternoon: slots[1]?.apertura || '15:30',
             closeAfternoon: slots[1]?.chiusura || '19:30'
         };
     });

     setStructuredHours(newStructure);
  };

  useEffect(() => {
    if (shop) {
      setFormData({ ...shop });
      setNewOwner(shop.ownerId || '');
      setError(null);

      // Se abbiamo i dati grezzi dal backend, popoliamo la griglia orari
      if (shop.rawHours) {
          parseBackendHoursToUI(shop.rawHours);
      }
    }
  }, [shop, isOpen]);

  // Gestione input orari nella griglia
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

  const isOperator = userRole === UserRole.OPERATOR;
  const isOwner = currentUserId && shop && shop.ownerId === currentUserId;
  const canEdit = isOperator || isOwner;

  if (!shop || !canEdit) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSaving(true);

    if (!formData.name) {
       setError("Il nome è obbligatorio");
       setIsSaving(false);
       return;
    }

    try {
        // 1. Ricostruiamo la stringa leggibile per la card (hours)
        const formattedHoursString = structuredHours.map(h => {
            if (h.isClosed) return `${h.day}: Chiuso`;
            return `${h.day}: ${h.openMorning}-${h.closeMorning} / ${h.openAfternoon}-${h.closeAfternoon}`;
        }).join('\n');

        // 2. Creiamo l'array 'raw' per il convertitore di Home.tsx (lo stesso formato di AddShopModal)
        // Home.tsx userà convertHoursToBackend su questo array
        const rawHoursForUpdate = structuredHours.map(h => ({
            day: h.day,
            isClosed: h.isClosed,
            // Passiamo i campi separati, Home.tsx (se aggiornato come detto prima) li gestirà
            // O, per compatibilità con l'helper "semplice", passiamo tutto in 'time' se necessario, 
            // ma l'approccio migliore è passare i campi espliciti se Home.tsx è pronto.
            // Dato che Home.tsx usa `rawHours`, passiamo la struttura che abbiamo appena creato, 
            // ma dobbiamo assicurarci che Home.tsx la legga. 
            // Per sicurezza, passiamo questi dati dentro l'oggetto Shop "sporco" affinché Home li processi.
            openMorning: h.openMorning,
            closeMorning: h.closeMorning,
            openAfternoon: h.openAfternoon,
            closeAfternoon: h.closeAfternoon,
            time: `${h.openMorning}-${h.closeMorning} / ${h.openAfternoon}-${h.closeAfternoon}` // Fallback
        }));

        const updatedShop = {
           ...shop,
           ...formData,
           hours: formattedHoursString, // Aggiorniamo la vista testuale
           rawHours: rawHoursForUpdate, // Passiamo i dati strutturati per il backend
           ownerId: newOwner.trim() !== '' ? newOwner.trim() : undefined
        };
         
        await onUpdate(updatedShop as Shop);
         
        setIsSaving(false);
        onClose();

    } catch (err: any) {
        console.error("Errore salvataggio modale:", err);
        setError("Errore durante il salvataggio: " + err.message);
        setIsSaving(false);
    }
  };

  const pendingRequest = shop?.pendingOwnerId;

// 2. Funzione per accettare (copia l'ID nel campo del proprietario)
const handleApproveClaim = () => {
    if (pendingRequest) {
        setNewOwner(pendingRequest); // Imposta l'input "Gestione Proprietario"
        alert("ID Utente copiato! Ora clicca su 'Salva Modifiche' in fondo al form per confermare.");
    }
};

  return (
    <div className="fixed inset-0 z-[3000] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in duration-200">
        
        {/* Header */}
        <div className="sticky top-0 bg-white px-6 py-4 border-b border-gray-100 flex justify-between items-center z-10">
          <div className="flex items-center gap-2">
            <div className="bg-orange-100 p-2 rounded-lg">
               <UserPlus className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Modifica Attività</h2>
              <p className="text-xs text-gray-500">Area Operatore - Verifica Dati</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {error && (
          <div className="mx-6 mt-4 p-3 bg-red-50 text-red-700 rounded-lg flex items-center gap-2 text-sm border border-red-200">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700">Nome Attività</label>
              <input 
                type="text" 
                className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 outline-none"
                value={formData.name || ''}
                onChange={e => setFormData({...formData, name: e.target.value})}
              />
            </div>
            <div className="space-y-1">
               <label className="text-sm font-medium text-gray-700">Categoria</label>
                  <select
                    className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 outline-none bg-white capitalize"
                    value={formData.categories?.[0] || ShopCategory.OTHER}
                    onChange={e => setFormData({...formData, categories: [e.target.value as ShopCategory]})}
                  >
                    {Object.values(ShopCategory)
                        .map(cat => (
                        <option key={cat} value={cat}>
                            {formatCategoryLabel(cat)}
                        </option>
                    ))}
                  </select>
            </div>
          </div>

          {/* NUOVA SEZIONE ORARI NEL MODALE DI MODIFICA */}
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

          {/* Associazione Venditore */}
          {userRole === UserRole.OPERATOR && (
          <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
             <h3 className="font-bold text-blue-900 text-sm mb-3 flex items-center gap-2">
               <UserPlus className="w-4 h-4"/> Gestione Proprietario
             </h3>
             <div className="space-y-1">
                <label className="text-xs font-semibold text-blue-800">Username o ID Utente</label>
                <div className="flex gap-2">
                   <input 
                     type="text" 
                     placeholder="Es. mario.rossi"
                     className="flex-1 border border-blue-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
                     value={newOwner}
                     onChange={e => setNewOwner(e.target.value)}
                   />
                </div>
                <p className="text-[10px] text-blue-600 mt-1">
                   Inserendo uno username, il sistema assocerà questo negozio all'utente specificato.
                </p>
             </div>
          </div>
          )}

          {userRole === UserRole.OPERATOR && pendingRequest && (
               <div className="mb-6 p-4 bg-orange-50 border border-orange-200 rounded-xl flex flex-col gap-2">
                   <div className="flex items-center gap-2 text-orange-800 font-bold">
                       Richiesta di Rivendicazione
                   </div>
                   <p className="text-sm text-orange-700">
                       L'utente <span className="font-mono bg-white px-1 border border-orange-200 rounded">{pendingRequest}</span> ha richiesto questa attività.
                   </p>
                   <button 
                       type="button"
                       onClick={handleApproveClaim}
                       className="self-start mt-1 px-3 py-1.5 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-xs font-bold shadow-sm transition-colors"
                   >
                       Accetta Richiesta (Imposta Proprietario)
                   </button>
               </div>
           )}

          {/* Links */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-gray-100">
             <div className="space-y-1">
                <label className="text-xs font-bold text-gray-500">Sito Web</label>
                <input 
                   type="url" 
                   className="w-full border rounded-lg px-3 py-2 text-sm"
                   value={formData.website || ''}
                   onChange={e => setFormData({...formData, website: e.target.value})}
                />
             </div>
             <div className="space-y-1">
                <label className="text-xs font-bold text-gray-500">Immagine URL</label>
                <input 
                   type="url" 
                   className="w-full border rounded-lg px-3 py-2 text-sm"
                   value={formData.imageUrl || ''}
                   onChange={e => setFormData({...formData, imageUrl: e.target.value})}
                />
             </div>
          </div>

          {/* Footer Actions */}
          <div className="flex gap-3 pt-4 border-t border-gray-100">
             <button 
               type="button" 
               onClick={onClose}
               disabled={isSaving}
               className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors disabled:opacity-50"
             >
               Annulla
             </button>
             <button 
               type="submit" 
               disabled={isSaving}
               className="flex-1 px-4 py-2 bg-green-600 rounded-lg text-white font-medium hover:bg-green-700 transition-colors shadow-sm flex items-center justify-center gap-2 disabled:opacity-70"
             >
               {isSaving ? (
                 <>
                   <Loader2 className="w-4 h-4 animate-spin" /> Elaborazione...
                 </>
               ) : (
                 <>
                   <Save className="w-4 h-4" /> Conferma & Pubblica
                 </>
               )}
             </button>
          </div>

        </form>
      </div>
    </div>
  );
};

export default EditShopModal;

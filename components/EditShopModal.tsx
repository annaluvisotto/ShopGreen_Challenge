import React, { useState, useEffect, useRef } from 'react';
import { Shop, ShopCategory, UserRole } from '../types';
import { X, Save, Trash2, Camera, Image as ImageIcon, Eye, ExternalLink, Clock, AlertTriangle, UserCheck, FileText, Crosshair } from 'lucide-react';

interface EditShopModalProps {
  shop: Shop | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (updatedShop: Shop) => void;
  userRole: UserRole;
  currentUserId?: string | null;
  isApprovalMode?: boolean; 
}

const DAYS_UI = ['Lunedì', 'Martedì', 'Mercoledì', 'Giovedì', 'Venerdì', 'Sabato', 'Domenica'];
const DAYS_DB = ['lunedi', 'martedi', 'mercoledi', 'giovedi', 'venerdi', 'sabato', 'domenica'];

const EditShopModal: React.FC<EditShopModalProps> = ({ 
    shop, isOpen, onClose, onUpdate, userRole, currentUserId, isApprovalMode = false 
}) => {
  const [name, setName] = useState('');
  const [category, setCategory] = useState<ShopCategory>(ShopCategory.OTHER);
  const [website, setWebsite] = useState('');
  const [googleMapsLink, setGoogleMapsLink] = useState('');
  const [iosMapsLink, setIosMapsLink] = useState('');
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [newOwner, setNewOwner] = useState('');
  const [lat, setLat] = useState<string | number>(0);
  const [lng, setLng] = useState<string | number>(0);
  const [structuredHours, setStructuredHours] = useState(DAYS_UI.map(day => ({ day, openMorning: '', closeMorning: '', openAfternoon: '', closeAfternoon: '', isClosed: false })));

  const parseBackendHoursToForm = (backendHours: any) => {
      if (!backendHours) return DAYS_UI.map(day => ({ day, openMorning: '09:00', closeMorning: '13:00', openAfternoon: '15:30', closeAfternoon: '19:30', isClosed: day === 'Domenica' }));
      return DAYS_UI.map((uiDay, index) => {
          const dbKey = DAYS_DB[index]; const dayData = backendHours[dbKey];
          let openM = '', closeM = '', openA = '', closeA = '', isClosed = !dayData || dayData.chiuso;
          if (dayData && dayData.slot && Array.isArray(dayData.slot)) {
              if (dayData.slot.length > 0) { openM = dayData.slot[0].apertura; closeM = dayData.slot[0].chiusura; }
              if (dayData.slot.length > 1) { openA = dayData.slot[1].apertura; closeA = dayData.slot[1].chiusura; }
          }
          if (!isClosed && !openM) { openM = '09:00'; closeM = '13:00'; openA = '15:30'; closeA = '19:30'; }
          return { day: uiDay, openMorning: openM, closeMorning: closeM, openAfternoon: openA, closeAfternoon: closeA, isClosed: isClosed };
      });
  };

  useEffect(() => {
    if (shop) {
      setName(shop.name);
      if (shop.categories && shop.categories.length > 0) setCategory(shop.categories[0] as ShopCategory); else setCategory(ShopCategory.OTHER);
      setWebsite(shop.website || '');
      setNewOwner(shop.ownerId || '');
      setPreviewImage(shop.imageUrl || null);
      setStructuredHours(parseBackendHoursToForm(shop.rawHours));
      setLat(shop.coordinates.lat);
      setLng(shop.coordinates.lng);

      const lat = shop.coordinates?.lat; const lng = shop.coordinates?.lng;
      if (shop.googleMapsLink) setGoogleMapsLink(shop.googleMapsLink); else if (lat && lng) setGoogleMapsLink(`https://www.google.com/maps/search/?api=1&query=${lat},${lng}`);
      if (shop.iosMapsLink) setIosMapsLink(shop.iosMapsLink); else if (lat && lng) setIosMapsLink(`https://maps.apple.com/?q=${lat},${lng}`);
    }
  }, [shop]);

  const handleAutoFillOwner = () => { if (shop?.pendingOwnerId) setNewOwner(shop.pendingOwnerId); };

  const updateHour = (i: number, f: string, v: string) => { const n = [...structuredHours]; (n[i] as any)[f] = v; setStructuredHours(n); };
  const toggleClosed = (i: number) => { const n = [...structuredHours]; n[i].isClosed = !n[i].isClosed; setStructuredHours(n); };
  
  const handleImageUpload = (e: any) => { const file = e.target.files?.[0]; if(file){ const r = new FileReader(); r.onloadend=()=>setPreviewImage(r.result as string); r.readAsDataURL(file); }};
  const removeImage = () => { setPreviewImage(null); if(fileInputRef.current) fileInputRef.current.value=''; };
  
  const openImageFull = () => { 
      if (!previewImage) return;
      if (!previewImage.startsWith('data:application/pdf')) {
          const w = window.open();
          if(w) w.document.write(`<img src="${previewImage}" style="max-width:100%"/>`);
          return;
      }
      try {
          const base64Data = previewImage.split(',')[1];
          const byteCharacters = atob(base64Data);
          const byteNumbers = new Array(byteCharacters.length);
          for (let i = 0; i < byteCharacters.length; i++) {
              byteNumbers[i] = byteCharacters.charCodeAt(i);
          }
          const byteArray = new Uint8Array(byteNumbers);
          const blob = new Blob([byteArray], { type: 'application/pdf' });
          const blobUrl = URL.createObjectURL(blob);
          window.open(blobUrl, '_blank');
      } catch (e) {
          console.error("Errore apertura PDF", e);
          alert("Impossibile aprire il PDF");
      }
  };

  const handleSave = () => { 
      if(!shop) return; 
      
      const updatedShop: Shop = {
          ...shop, 
          name, 
          categories: [category], 
          website, 
          googleMapsLink, 
          iosMapsLink, 
          ownerId: newOwner, 
          imageUrl: previewImage || shop.imageUrl, 
          rawHours: structuredHours,
          coordinates: {
              lat: Number(lat),
              lng: Number(lng)
          }
      }; 
      onUpdate(updatedShop); 
      onClose(); 
  };
  
  const formatCategoryLabel = (cat: string) => { if (cat === 'cura della casa e della persona') return 'Cura Casa & Persona'; return cat.charAt(0).toUpperCase() + cat.slice(1); };
  const isPdfFile = previewImage?.startsWith('data:application/pdf');

  if (!isOpen || !shop) return null;

  return (
    <div className="fixed inset-0 z-[3000] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-[30px] shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-300">
        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-white">
          <h2 className="text-xl font-bold text-gray-800">{isApprovalMode ? 'Verifica e Approvazione' : 'Modifica Attività'}</h2>
          <button onClick={onClose} className="p-2 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors"><X className="w-5 h-5 text-gray-500" /></button>
        </div>
        <div className="p-6 space-y-4 max-h-[80vh] overflow-y-auto custom-scrollbar">
          
          {isApprovalMode && shop.pendingOwnerId && (
             <div onClick={handleAutoFillOwner} className="bg-orange-50 border border-orange-200 p-4 rounded-xl flex items-start gap-3 mb-4 cursor-pointer hover:bg-orange-100 transition-colors group" title="Clicca per assegnare proprietario">
                 <div className="p-2 bg-orange-100 rounded-full text-orange-600 mt-1 group-hover:scale-110 transition-transform"><AlertTriangle className="w-5 h-5" /></div>
                 <div>
                     <h3 className="text-orange-900 font-bold text-sm mb-1">Richiesta di Proprietà (Clicca qui)</h3>
                     <p className="text-xs text-orange-800">L'utente <b>{shop.pendingOwnerId}</b> rivendica questo negozio. Clicca su questo box per accettare.</p>
                 </div>
             </div>
          )}

          {isApprovalMode && (
              <div className="space-y-2 mb-4 p-4 bg-gray-50 rounded-2xl border border-gray-200">
                  <div className="flex justify-between items-center mb-2">
                      <label className="text-gray-700 font-bold text-sm">{isApprovalMode ? "Licenza di vendita" : "Foto del negozio"}</label>
                      {previewImage && <button type="button" onClick={openImageFull} className="text-xs text-blue-600 font-bold flex items-center gap-1 hover:underline"><ExternalLink className="w-3 h-3"/> Apri Originale</button>}
                  </div>
                  
                  {previewImage ? (
                      <div className="relative w-full h-48 rounded-xl overflow-hidden shadow-sm group border border-gray-200 bg-white">
                          {isPdfFile ? (
                              <div className="w-full h-full flex flex-col items-center justify-center text-red-500 bg-gray-50">
                                  <FileText className="w-12 h-12 mb-2" />
                                  <span className="text-sm font-bold text-gray-600">Documento PDF</span>
                              </div>
                          ) : (
                              <img src={previewImage} alt="Licenza" className="w-full h-full object-contain" />
                          )}
                          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                              <button type="button" onClick={openImageFull} className="p-3 bg-blue-600 rounded-full text-white shadow-lg"><Eye className="w-5 h-5"/></button>
                              <button type="button" onClick={() => fileInputRef.current?.click()} className="p-3 bg-white rounded-full text-gray-800 shadow-lg"><Camera className="w-5 h-5"/></button>
                              <button type="button" onClick={removeImage} className="p-3 bg-red-500 rounded-full text-white shadow-lg"><Trash2 className="w-5 h-5"/></button>
                          </div>
                      </div>
                  ) : (
                      <div onClick={() => fileInputRef.current?.click()} className="w-full h-32 border-2 border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center text-gray-400 cursor-pointer">
                          <ImageIcon className="w-8 h-8 mb-2" />
                          <span className="text-xs">Nessuna immagine</span>
                      </div>
                  )}
                  <input type="file" ref={fileInputRef} onChange={handleImageUpload} accept="image/*,application/pdf" className="hidden" />
              </div>
          )}

          <div className="space-y-1"><label className="text-xs font-bold text-gray-500 uppercase ml-1">Nome Attività</label><input type="text" className="w-full border border-gray-200 rounded-xl px-4 py-3 font-medium focus:ring-2 focus:ring-green-500 outline-none" value={name} onChange={e => setName(e.target.value)} /></div>
          <div className="space-y-1"><label className="text-xs font-bold text-gray-500 uppercase ml-1">Categoria</label><select className="w-full border border-gray-200 rounded-xl px-4 py-3 font-medium focus:ring-2 focus:ring-green-500 outline-none capitalize" value={category} onChange={e => setCategory(e.target.value as ShopCategory)}>{Object.values(ShopCategory).map(cat => <option key={cat} value={cat}>{formatCategoryLabel(cat)}</option>)}</select></div>
          
          <div className="space-y-1">
              <div className="flex items-center gap-2 ml-1 mb-1">
                  <Crosshair className="w-4 h-4 text-gray-400" />
                  <label className="text-xs font-bold text-gray-500 uppercase">Coordinate</label>
              </div>
              <div className="flex gap-3">
                  <input type="number" step="any" placeholder="Lat" value={lat} onChange={(e) => setLat(e.target.value)} className="w-full border border-gray-200 rounded-xl px-4 py-3 font-medium focus:ring-2 focus:ring-green-500 outline-none" />
                  <input type="number" step="any" placeholder="Lng" value={lng} onChange={(e) => setLng(e.target.value)} className="w-full border border-gray-200 rounded-xl px-4 py-3 font-medium focus:ring-2 focus:ring-green-500 outline-none" />
              </div>
          </div>

          <div className="space-y-1"><label className="text-xs font-bold text-gray-500 uppercase ml-1">Sito Web</label><input type="url" className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-green-500 outline-none" value={website} onChange={e => setWebsite(e.target.value)} /></div>
          
          <div className="bg-gray-50 rounded-[20px] p-5 border border-gray-100">
              <div className="flex items-center gap-2 mb-3"><Clock className="w-4 h-4 text-gray-400" /><label className="text-gray-600 font-bold text-sm">Orari</label></div>
              <div className="space-y-3">
                  {structuredHours.map((item, index) => (
                      <div key={item.day} className="flex flex-col md:flex-row md:items-center justify-between gap-2 text-sm bg-white p-3 rounded-xl border border-gray-100 shadow-sm">
                          <span className="w-20 font-bold text-gray-700">{item.day.slice(0,3)}</span>
                          {!item.isClosed ? <div className="flex flex-col gap-2 w-full"><div className="flex items-center gap-2"><span className="text-[10px] text-gray-400 font-bold w-4">AM</span><input type="time" value={item.openMorning} onChange={(e) => updateHour(index, 'openMorning', e.target.value)} className="bg-gray-100 border border-gray-200 rounded-lg px-2 py-1 text-xs outline-none flex-1" /><span className="text-gray-400">-</span><input type="time" value={item.closeMorning} onChange={(e) => updateHour(index, 'closeMorning', e.target.value)} className="bg-gray-100 border border-gray-200 rounded-lg px-2 py-1 text-xs outline-none flex-1" /></div><div className="flex items-center gap-2"><span className="text-[10px] text-gray-400 font-bold w-4">PM</span><input type="time" value={item.openAfternoon} onChange={(e) => updateHour(index, 'openAfternoon', e.target.value)} className="bg-gray-100 border border-gray-200 rounded-lg px-2 py-1 text-xs outline-none flex-1" /><span className="text-gray-400">-</span><input type="time" value={item.closeAfternoon} onChange={(e) => updateHour(index, 'closeAfternoon', e.target.value)} className="bg-gray-100 border border-gray-200 rounded-lg px-2 py-1 text-xs outline-none flex-1" /></div></div> : <span className="flex-1 text-center text-gray-400 italic text-xs py-2">Giorno di chiusura</span>}
                          <button type="button" onClick={() => toggleClosed(index)} className={`hidden md:block px-3 py-1.5 rounded-lg text-xs font-bold transition-colors border ${item.isClosed ? 'bg-red-50 text-red-600 border-red-100' : 'bg-green-50 text-green-700 border-green-100'}`}>{item.isClosed ? 'Chiuso' : 'Aperto'}</button>
                      </div>
                  ))}
              </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1"><label className="text-xs font-bold text-gray-500 uppercase ml-1">Google Maps</label><input type="url" className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-green-500 outline-none" value={googleMapsLink} onChange={e => setGoogleMapsLink(e.target.value)} /></div>
            <div className="space-y-1"><label className="text-xs font-bold text-gray-500 uppercase ml-1">Apple Maps</label><input type="url" className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-green-500 outline-none" value={iosMapsLink} onChange={e => setIosMapsLink(e.target.value)} /></div>
          </div>

          {userRole === UserRole.OPERATOR && (
              <div className="pt-4 border-t border-gray-100">
                  <label className="text-xs font-bold text-blue-600 uppercase ml-1 mb-1 block">Gestione Proprietario (ID)</label>
                  <input type="text" placeholder="ID Utente Proprietario" className="w-full border border-blue-200 bg-blue-50/50 rounded-xl px-4 py-3 font-mono text-sm focus:ring-2 focus:ring-blue-500 outline-none" value={newOwner} onChange={e => setNewOwner(e.target.value)} />
                  <p className="text-[10px] text-gray-400 mt-1 ml-1">{isApprovalMode ? "Clicca sulla barra arancione in alto per riempire automaticamente." : "Modifica manuale."}</p>
              </div>
          )}
        </div>
        <div className="p-4 border-t border-gray-100 flex gap-3 bg-gray-50"><button onClick={handleSave} className="flex-1 bg-green-600 hover:bg-green-700 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg transition-all active:scale-95"><Save className="w-5 h-5" />{isApprovalMode ? 'Conferma e Pubblica' : 'Salva Modifiche'}</button></div>
      </div>
    </div>
  );
};

export default EditShopModal;
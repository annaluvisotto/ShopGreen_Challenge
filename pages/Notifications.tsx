import React, { useState, useEffect } from 'react';
import { Notification, NotificationType, UserRole, Shop } from '../types';
import { Bell, CheckCircle, Info, FileText, XCircle, Loader2, Store, UserCheck, MapPin, AlertTriangle, Ticket, Gift } from 'lucide-react';
import { getNegozi, updateNegozio, deleteNegozio, getNegozioById } from '../services/negoziService';
import { MOCK_NOTIFICATIONS } from '../constants'; // Assicurati che i tuoi mock siano qui

import EditShopModal from '../components/EditShopModal';

interface NotificationsProps {
  userRole: UserRole;
}

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

const Notifications: React.FC<NotificationsProps> = ({ userRole }) => {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [localNotifications, setLocalNotifications] = useState<Notification[]>([]); 
  const [isLoading, setIsLoading] = useState(false);
  const [shopToApprove, setShopToApprove] = useState<Shop | null>(null);

  const isOperator = userRole === UserRole.OPERATOR;

  const refreshNotifications = async () => {
        setIsLoading(true);
        try {
            if (isOperator) {
                const allShops = await getNegozi(undefined, undefined, undefined);
                const shopsOfInterest = allShops.filter(shop => !shop.verifiedByOperator || !!shop.pendingOwnerId);

                const mappedNotifications: Notification[] = shopsOfInterest.map(shop => ({
                    id: shop.id,
                    type: NotificationType.REPORT,
                    title: shop.name,
                    name: shop.name,
                    previewText: shop.categories.join(', '),
                    category: shop.categories.join(', '),
                    fullDescription: shop.description || '',
                    date: 'In attesa', 
                    read: false,
                    imageUrl: shop.imageUrl,
                    pendingOwnerId: shop.pendingOwnerId, 
                    address: `Lat: ${shop.coordinates.lat.toFixed(4)}, Lng: ${shop.coordinates.lng.toFixed(4)}`,
                    reporterId: shop.ownerId,
                    verifiedByOperator: shop.verifiedByOperator 
                }));
                setLocalNotifications(mappedNotifications);
            } else {
                setLocalNotifications(MOCK_NOTIFICATIONS);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setIsLoading(false);
        }
  };

  useEffect(() => { refreshNotifications(); }, [userRole]);

  const selectedNotification = localNotifications.find(n => n.id === selectedId);
  const isSelectedClaimUI = selectedNotification ? !!selectedNotification.pendingOwnerId : false;

  const handleOpenApproveModal = async (notification: Notification) => {
      try {
          const fullShop = await getNegozioById(notification.id);
          setShopToApprove(fullShop); 
      } catch (error) { alert("Errore recupero dati."); }
  };

  const handleShopApproved = async (updatedShop: Shop) => {
      try {
           let orariBackend;
           if (updatedShop.rawHours) orariBackend = convertHoursToBackend(updatedShop.rawHours);
           const backendPayload = {
               nome: updatedShop.name,
               licenzaOppureFoto: updatedShop.imageUrl,
               categoria: updatedShop.categories, 
               coordinate: [Number(updatedShop.coordinates.lat), Number(updatedShop.coordinates.lng)],
               orari: orariBackend, 
               verificatoDaOperatore: true,
               proprietario: updatedShop.ownerId,
               linkSito: updatedShop.website,
               maps: updatedShop.googleMapsLink,
               mappe: updatedShop.iosMapsLink
           };
           await updateNegozio(updatedShop.id, backendPayload);
           alert("Operazione completata con successo!");
           setShopToApprove(null); refreshNotifications(); setSelectedId(null);    
      } catch (error) { alert("Errore durante l'approvazione"); }
  };

  const handleReject = async (notification: Notification) => {
      if(!window.confirm("Sei sicuro?")) return;
      try {
          if (notification.verifiedByOperator) {
              await updateNegozio(notification.id, { proprietarioInAttesa: null });
          } else {
              await deleteNegozio(notification.id);
          }
          setSelectedId(null); refreshNotifications();
      } catch (error) { alert("Errore operazione"); }
  };

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-8 h-[calc(100vh-64px)] flex flex-col md:flex-row gap-6">
       
       {/* SIDEBAR: LISTA */}
       <div className={`w-full md:w-1/3 bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden flex flex-col ${selectedId ? 'hidden md:flex' : 'flex'}`}>
         <div className="p-4 border-b border-gray-100 flex justify-between items-center">
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <Bell className="w-5 h-5 text-green-600" /> 
                {isOperator ? 'Da visualizzare' : 'Promozioni & Avvisi'}
            </h2>
         </div>
         <div className="overflow-y-auto flex-1 p-3 space-y-3 relative bg-gray-50/50">
            {isLoading && <div className="absolute inset-0 bg-white/80 z-10 flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-green-600" /></div>}
            {localNotifications.map(n => {
                const isClaim = !!n.pendingOwnerId;
                const isPromo = n.type === NotificationType.PROMO;
                
                // Stile originale per Operatore, Stile Mock per Utente
                const buttonClass = isOperator 
                    ? `w-full text-left bg-white rounded-xl shadow-sm border-l-4 transition-all hover:shadow-md p-4 ${selectedId === n.id ? 'ring-2 ring-green-500' : ''} ${isClaim ? 'border-orange-500' : 'border-green-500'}`
                    : `w-full text-left bg-white rounded-xl shadow-sm border-2 transition-all p-4 ${selectedId === n.id ? 'border-green-400 bg-green-50/50' : 'border-transparent'}`;

                return (
                 <button key={n.id} onClick={() => setSelectedId(n.id)} className={buttonClass}>
                       <div className="flex justify-between items-center mb-2">
                           {isOperator ? (
                               isClaim ? <span className="text-xs font-bold text-white bg-orange-500 px-2 py-1 rounded uppercase flex items-center gap-1 shadow-sm"><UserCheck className="w-3 h-3"/> RIVENDICAZIONE</span>
                                       : <span className="text-xs font-bold text-white bg-green-600 px-2 py-1 rounded uppercase flex items-center gap-1 shadow-sm"><Store className="w-3 h-3"/> NUOVA SEGNALAZIONE</span>
                           ) : (
                               <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${isPromo ? 'bg-purple-100 text-purple-600' : 'bg-gray-100 text-gray-500'}`}>
                                   {n.type}
                               </span>
                           )}
                           <span className="text-[10px] text-gray-400">{n.date}</span>
                       </div>
                       <h3 className="text-base font-bold text-gray-800 mb-1 line-clamp-1">{n.title || n.name}</h3>
                       <div className="flex items-center text-xs text-gray-500 line-clamp-1">
                           {isOperator ? <MapPin className="w-3 h-3 mr-1" /> : null}
                           {n.previewText || n.address}
                       </div>
                 </button>
               )})
            }
         </div>
      </div>

      {/* DETTAGLIO */}
      <div className={`w-full md:w-2/3 bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden flex flex-col ${!selectedId ? 'hidden md:flex' : 'flex'}`}>
         {selectedNotification ? (
            <div className="flex-1 overflow-y-auto p-6 md:p-10">
                 
                 {/* Header comune */}
                 <div className="mb-6 flex items-center justify-between border-b border-gray-100 pb-6">
                    <div className="flex items-center gap-4">
                        <div className={`${isOperator ? (isSelectedClaimUI ? 'bg-orange-100 text-orange-600' : 'bg-green-100 text-green-600') : 'bg-purple-100 text-purple-600'} p-4 rounded-2xl`}>
                            {isOperator ? (isSelectedClaimUI ? <UserCheck className="w-8 h-8" /> : <Store className="w-8 h-8" />) : <Ticket className="w-8 h-8" />}
                        </div>
                        <div>
                            <span className="text-xs font-bold uppercase tracking-wider text-gray-400">{selectedNotification.type}</span>
                            <h1 className="text-3xl font-bold text-gray-900 mt-1">{selectedNotification.name || selectedNotification.title}</h1>
                        </div>
                    </div>
                    <span className="text-sm text-gray-400">{selectedNotification.date}</span>
                 </div>

                 {/* VISTA OPERATORE (IDENTICA ALLA TUA ORIGINALE) */}
                 {isOperator && (
                    <>
                        {isSelectedClaimUI && (
                            <div className="bg-orange-50 border border-orange-200 p-5 rounded-2xl mb-8 flex items-start gap-3">
                                <AlertTriangle className="w-6 h-6 text-orange-600" />
                                <div>
                                    <h3 className="text-orange-900 font-bold text-lg mb-1">Richiesta di Proprietà</h3>
                                    <p className="text-sm text-orange-800">L'utente <b>{selectedNotification.pendingOwnerId}</b> vuole questo negozio.</p>
                                </div>
                            </div>
                        )}
                        <div className="grid md:grid-cols-2 gap-6 mb-8">
                            <div className="bg-gray-50 border border-gray-100 rounded-2xl p-5">
                                <h3 className="text-gray-900 font-bold mb-4 flex items-center gap-2"><Info className="w-4 h-4"/> Dettagli</h3>
                                <ul className="space-y-3 text-sm text-gray-600">
                                    <li className="flex justify-between"><span>Categoria:</span> <span className="font-medium text-gray-900 capitalize">{selectedNotification.previewText || selectedNotification.category}</span></li>
                                    <li className="flex justify-between"><span>{isSelectedClaimUI ? 'Richiedente:' : 'Segnalato da:'}</span> <span className="font-medium text-gray-900 font-mono bg-white px-2 py-0.5 rounded border border-gray-200 text-xs">{selectedNotification.pendingOwnerId || selectedNotification.reporterId || "Anonimo"}</span></li>
                                </ul>
                            </div>
                            {selectedNotification.imageUrl ? (
                                <div className="bg-gray-50 border border-gray-100 rounded-2xl p-5">
                                    <h3 className="text-gray-900 font-bold mb-4 flex items-center gap-2"><FileText className="w-4 h-4"/> Documento</h3>
                                    <img src={selectedNotification.imageUrl} alt="Documento" className="w-full h-48 rounded-md object-cover border border-gray-200" />
                                </div>
                            ) : <div className="bg-gray-50 border border-gray-100 rounded-2xl p-5 flex items-center justify-center text-gray-400 text-sm">Nessuna immagine</div>}
                        </div>
                    </>
                 )}

                 {/* VISTA UTENTE (STILE MOCK SCREENSHOT) */}
                 {!isOperator && (
                    <div className="animate-in fade-in duration-500">
                        {selectedNotification.imageUrl && (
                            <div className="mb-8 rounded-3xl overflow-hidden shadow-lg border border-gray-100">
                                <img src={selectedNotification.imageUrl} alt="Promo" className="w-full h-64 object-cover" />
                            </div>
                        )}
                        <p className="text-xl text-gray-600 leading-relaxed mb-10">
                            {selectedNotification.fullDescription || selectedNotification.previewText}
                        </p>
                    </div>
                 )}

                 {/* AZIONI DIFFERENTI PER RUOLO */}
                 <div className="flex flex-col gap-3 pt-4 border-t border-gray-100">
                      {isOperator ? (
                        <>
                            <button onClick={() => handleOpenApproveModal(selectedNotification)} className={`w-full text-white px-6 py-4 rounded-xl font-bold shadow-lg flex items-center justify-center gap-3 ${isSelectedClaimUI ? 'bg-orange-500 hover:bg-orange-600' : 'bg-green-600 hover:bg-green-700'}`}>
                                <CheckCircle className="w-6 h-6" /> {isSelectedClaimUI ? 'Esamina Rivendicazione' : 'Verifica Dati e Pubblica'}
                            </button>
                            <button onClick={() => handleReject(selectedNotification)} className="w-full bg-white border-2 border-red-100 text-red-500 hover:bg-red-50 px-6 py-4 rounded-xl font-bold flex items-center justify-center gap-3">
                                <XCircle className="w-6 h-6" /> {selectedNotification.verifiedByOperator ? 'Rifiuta Rivendicazione' : 'Rifiuta e Cancella'}
                            </button>
                        </>
                      ) : (
                        selectedNotification.type === NotificationType.PROMO && (
                            <button className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-4 rounded-2xl shadow-md flex items-center justify-center gap-2">
                                <Gift className="w-5 h-5" /> Usa il coupon ora
                            </button>
                        )
                      )}
                 </div>
            </div>
         ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-gray-400 bg-gray-50/30"><Store className="w-16 h-16 mb-4 opacity-10" /><p className="text-lg font-medium">Seleziona una notifica</p></div>
         )}
      </div>
      <EditShopModal shop={shopToApprove} isOpen={!!shopToApprove} onClose={() => setShopToApprove(null)} onUpdate={handleShopApproved} userRole={userRole} isApprovalMode={true} />
    </div>
  );
};

export default Notifications;
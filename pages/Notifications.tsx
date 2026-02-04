//versione che utilizza i mock

/**import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MOCK_NOTIFICATIONS } from '../constants';
import { Notification, NotificationType, UserRole } from '../types';
import { Bell, CheckCircle, Info, Ticket, FileText, ChevronRight, XCircle, ArrowLeft, AlertCircle } from 'lucide-react';

interface NotificationsProps {
  userRole: UserRole;
}

const Notifications: React.FC<NotificationsProps> = ({ userRole }) => {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [localNotifications, setLocalNotifications] = useState(MOCK_NOTIFICATIONS);
  const navigate = useNavigate();

  // Filter logic:
  // Operators see SYSTEM and REPORT
  // Users see SYSTEM and PROMO
  const filteredNotifications = localNotifications.filter(n => {
    if (n.type === NotificationType.SYSTEM) return true;
    if (userRole === UserRole.OPERATOR) return n.type === NotificationType.REPORT;
    return n.type === NotificationType.PROMO;
  });

  const selectedNotification = filteredNotifications.find(n => n.id === selectedId);

  const markAsRead = (id: string) => {
    setLocalNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const handleSelect = (n: Notification) => {
    setSelectedId(n.id);
    if (!n.read) markAsRead(n.id);
  };

  const handleOperatorAction = (notification: Notification, action: 'approve' | 'reject') => {
    if (action === 'approve') {
        // Navigate to Home map with state to open AddShopModal pre-filled
        navigate('/', { 
            state: { 
                action: 'create_shop_from_report', 
                data: {
                    name: notification.shopName,
                    ownerId: notification.reporterId
                }
            } 
        });
    } else {
        alert(`Segnalazione Respinta. L'utente riceverà una notifica.`);
        // In a real app, this would update backend status
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-8 h-[calc(100vh-64px)] flex flex-col md:flex-row gap-6">
      
      {}
      <div className={`w-full md:w-1/3 bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden flex flex-col ${selectedId ? 'hidden md:flex' : 'flex'}`}>
         <div className="p-4 border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 flex justify-between items-center">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
               <Bell className="w-5 h-5 text-green-600" /> 
               {userRole === UserRole.OPERATOR ? 'Segnalazioni & Avvisi' : 'Promozioni & Avvisi'}
            </h2>
         </div>
         
         <div className="overflow-y-auto flex-1 p-2 space-y-2">
            {filteredNotifications.length === 0 ? (
               <div className="text-center py-10 text-gray-400">Nessuna notifica presente.</div>
            ) : (
               filteredNotifications.map(notification => (
                 <button
                   key={notification.id}
                   onClick={() => handleSelect(notification)}
                   className={`w-full text-left p-4 rounded-xl transition-all border border-transparent
                     ${selectedId === notification.id 
                       ? 'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800 ring-1 ring-green-300' 
                       : 'hover:bg-gray-50 dark:hover:bg-gray-700/50'
                     }
                     ${!notification.read ? 'bg-blue-50/50 dark:bg-blue-900/10' : ''}
                   `}
                 >
                   <div className="flex justify-between items-start mb-1">
                      <div className="flex items-center gap-2">
                         {notification.type === NotificationType.PROMO && <span className="bg-purple-100 text-purple-700 px-2 py-0.5 rounded text-[10px] font-bold uppercase">Promo</span>}
                         {notification.type === NotificationType.REPORT && <span className="bg-orange-100 text-orange-700 px-2 py-0.5 rounded text-[10px] font-bold uppercase">Report</span>}
                         {notification.type === NotificationType.SYSTEM && <span className="bg-gray-100 text-gray-700 px-2 py-0.5 rounded text-[10px] font-bold uppercase">Info</span>}
                         
                         {!notification.read && <span className="w-2 h-2 rounded-full bg-blue-500"></span>}
                      </div>
                      <span className="text-xs text-gray-400">{notification.date}</span>
                   </div>
                   <h3 className={`text-sm font-bold text-gray-900 dark:text-white mb-1 line-clamp-1 ${!notification.read ? 'text-black' : ''}`}>
                      {notification.title}
                   </h3>
                   <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 leading-relaxed">
                      {notification.previewText}
                   </p>
                 </button>
               ))
            )}
         </div>
      </div>

      {}
      <div className={`w-full md:w-2/3 bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden flex flex-col ${!selectedId ? 'hidden md:flex' : 'flex'}`}>
         
         {selectedNotification ? (
            <>
              {}
              <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex items-center gap-3 md:hidden">
                 <button onClick={() => setSelectedId(null)} className="p-2 hover:bg-gray-100 rounded-full">
                    <ArrowLeft className="w-5 h-5 text-gray-600" />
                 </button>
                 <span className="font-bold text-gray-900">Torna alla lista</span>
              </div>

              <div className="flex-1 overflow-y-auto p-6 md:p-10 animate-in fade-in slide-in-from-bottom-4 duration-300">
                 
                 {}
                 <div className="mb-6 flex items-center justify-between">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest flex items-center gap-2
                      ${selectedNotification.type === NotificationType.PROMO ? 'bg-purple-100 text-purple-700' : 
                        selectedNotification.type === NotificationType.REPORT ? 'bg-orange-100 text-orange-700' : 'bg-gray-100 text-gray-700'}
                    `}>
                       {selectedNotification.type === NotificationType.PROMO && <Ticket className="w-4 h-4"/>}
                       {selectedNotification.type === NotificationType.REPORT && <FileText className="w-4 h-4"/>}
                       {selectedNotification.type === NotificationType.SYSTEM && <Info className="w-4 h-4"/>}
                       {selectedNotification.type}
                    </span>
                    <span className="text-sm text-gray-400 font-medium">{selectedNotification.date}</span>
                 </div>

                 <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6 leading-tight">
                    {selectedNotification.title}
                 </h1>

                 {}
                 {selectedNotification.type === NotificationType.PROMO && selectedNotification.imageUrl && (
                    <div className="mb-8 rounded-2xl overflow-hidden shadow-lg border border-gray-100 h-64 w-full">
                       <img src={selectedNotification.imageUrl} alt="Promo" className="w-full h-full object-cover" />
                    </div>
                 )}

                 {}
                 {selectedNotification.type === NotificationType.REPORT && (
                    <div className="bg-orange-50 border border-orange-100 rounded-xl p-6 mb-8">
                       <h3 className="text-orange-900 font-bold mb-4 flex items-center gap-2">
                          <AlertCircle className="w-5 h-5" /> Dati Segnalazione
                       </h3>
                       <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                          <div className="bg-white p-3 rounded-lg border border-orange-100">
                             <span className="block text-xs text-gray-500 uppercase font-bold">Nome Attività</span>
                             <span className="text-gray-900 font-medium">{selectedNotification.shopName}</span>
                          </div>
                          <div className="bg-white p-3 rounded-lg border border-orange-100">
                             <span className="block text-xs text-gray-500 uppercase font-bold">Licenza Commerciale</span>
                             <span className="text-gray-900 font-medium">{selectedNotification.licenseId}</span>
                          </div>
                          {selectedNotification.reporterId && (
                            <div className="bg-white p-3 rounded-lg border border-orange-100 col-span-2">
                                <span className="block text-xs text-gray-500 uppercase font-bold">Utente Segnalante</span>
                                <span className="text-gray-900 font-medium">{selectedNotification.reporterId}</span>
                            </div>
                          )}
                       </div>
                    </div>
                 )}

                 <div className="prose dark:prose-invert max-w-none text-gray-600 dark:text-gray-300 leading-loose text-lg">
                    {selectedNotification.fullDescription}
                 </div>

                 {}
                 <div className="mt-10 pt-8 border-t border-gray-100 dark:border-gray-700">
                    
                    {}
                    {selectedNotification.type === NotificationType.PROMO && (
                       <button className="w-full md:w-auto bg-green-600 hover:bg-green-700 text-white px-8 py-3 rounded-xl font-bold shadow-lg transition-transform hover:scale-105 flex items-center justify-center gap-2">
                          <Ticket className="w-5 h-5" /> Usa Coupon in Negozio
                       </button>
                    )}

                    {}
                    {selectedNotification.type === NotificationType.REPORT && (
                       <div className="flex flex-col md:flex-row gap-4">
                          <button 
                            onClick={() => handleOperatorAction(selectedNotification, 'approve')}
                            className="flex-1 bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-xl font-bold shadow-md flex items-center justify-center gap-2 transition-colors"
                          >
                             <CheckCircle className="w-5 h-5" /> Conferma Licenza
                          </button>
                          <button 
                             onClick={() => handleOperatorAction(selectedNotification, 'reject')}
                             className="flex-1 bg-white border border-red-200 text-red-600 hover:bg-red-50 px-6 py-3 rounded-xl font-bold shadow-sm flex items-center justify-center gap-2 transition-colors"
                          >
                             <XCircle className="w-5 h-5" /> Respingi
                          </button>
                       </div>
                    )}
                 </div>

              </div>
            </>
         ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-gray-400 bg-gray-50/30">
               <Bell className="w-16 h-16 mb-4 opacity-20" />
               <p className="text-lg font-medium">Seleziona una notifica per leggere i dettagli</p>
            </div>
         )}
      </div>
    </div>
  );
};

export default Notifications;**/

//versione che utilizza i services e si collega al backend

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Notification, NotificationType, UserRole, Shop } from '../types';
import { Bell, CheckCircle, Info, Ticket, FileText, XCircle, ArrowLeft, Loader2, Store, UserCheck } from 'lucide-react'; // Aggiunta icona UserCheck

// Servizi
import { getNotifications } from '../services/notificheService';
import { updateNegozio, deleteNegozio, getNegozioById } from '../services/negoziService';

// Importiamo il Modale di Modifica (che useremo per approvare/correggere)
import EditShopModal from '../components/EditShopModal';

interface NotificationsProps {
  userRole: UserRole;
}

const Notifications: React.FC<NotificationsProps> = ({ userRole }) => {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  
  // Nota: Assumiamo che Notification estenda Shop o abbia i campi extra come pendingOwnerId
  // Se TypeScript si lamenta, dovresti usare 'any[]' o aggiornare l'interfaccia Notification
  const [localNotifications, setLocalNotifications] = useState<any[]>([]); 
  const [isLoading, setIsLoading] = useState(false);
  
  // Stato per il Modale di Modifica/Approvazione
  const [shopToApprove, setShopToApprove] = useState<Shop | null>(null);

  const navigate = useNavigate();

  // 1. CARICAMENTO (Scarica i negozi non verificati O con rivendicazione)
  const refreshNotifications = async () => {
        setIsLoading(true);
        const data = await getNotifications();
        // Il backend ora restituisce sia i nuovi (verificato: false) 
        // sia le rivendicazioni (proprietarioInAttesa: string).
        setLocalNotifications(data);
        setIsLoading(false);
  };

  useEffect(() => {
    refreshNotifications();
  }, []);

  // Filter logic
  const filteredNotifications = localNotifications.filter(n => {
    if (n.type === NotificationType.SYSTEM) return true;
    if (userRole === UserRole.OPERATOR) {
        // Mostriamo sia le segnalazioni REPORT sia le Rivendicazioni (che sono tecnicamente REPORT arricchiti)
        return n.type === NotificationType.REPORT;
    }
    return n.type === NotificationType.PROMO; 
  });

  const selectedNotification = filteredNotifications.find(n => n.id === selectedId);

  // LOGICA AZIONI OPERATORE
  
  // A. APRI IL FORM MODIFICABILE (APPROVAZIONE)
  const handleOpenApproveModal = async (notification: Notification) => {
      try {
          // Recuperiamo l'oggetto Shop completo usando l'ID della notifica (che è l'ID del negozio)
          const fullShop = await getNegozioById(notification.id);
          setShopToApprove(fullShop); 
      } catch (error) {
          alert("Errore nel recupero dei dati del negozio.");
      }
  };

  // B. QUANDO L'OPERATORE SALVA IL FORM (CONFERMA)
  const handleShopApproved = async (updatedShop: Shop) => {
      try {
          // Costruiamo il payload per il backend (negozi.js PUT)
           const backendPayload = {
               nome: updatedShop.name,
               licenzaOppureFoto: updatedShop.imageUrl,
               categoria: updatedShop.categories, 
               coordinate: [updatedShop.coordinates.lat, updatedShop.coordinates.lng],
               
               verificatoDaOperatore: true, // LA CHIAVE MAGICA: Approva il negozio
               
               // <--- MODIFICA FONDAMENTALE PER RIVENDICAZIONE --->
               // Se EditShopModal ha impostato un ownerId (perché l'operatore ha cliccato "Accetta Richiesta"),
               // dobbiamo passarlo al backend. Il backend userà questo per promuovere l'utente.
               proprietario: updatedShop.ownerId 
               // -------------------------------------------------
           };
           
           await updateNegozio(updatedShop.id, backendPayload);

          alert("Operazione completata con successo!");
          setShopToApprove(null); // Chiudi modale
          refreshNotifications(); // Ricarica lista (il negozio sparirà da qui)
          setSelectedId(null);    // Deseleziona
          
      } catch (error) {
          console.error(error);
          alert("Errore durante l'approvazione");
      }
  };

  // C. RESPINGI (CANCELLA IL NEGOZIO)
  const handleReject = async (id: string) => {
      if(!window.confirm("Sei sicuro di voler respingere questa richiesta? Se è un nuovo negozio verrà cancellato.")) return;
      
      try {
          await deleteNegozio(id);
          alert("Richiesta respinta e cancellata");
          setSelectedId(null);
          refreshNotifications();
      } catch (error) {
          alert("Errore durante la cancellazione");
      }
  };

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-8 h-[calc(100vh-64px)] flex flex-col md:flex-row gap-6">
      
      {/* COLONNA SINISTRA: LISTA */}
       <div className={`w-full md:w-1/3 bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden flex flex-col ${selectedId ? 'hidden md:flex' : 'flex'}`}>
         
         <div className="p-4 border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 flex justify-between items-center">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
               <Bell className="w-5 h-5 text-green-600" /> 
               {userRole === UserRole.OPERATOR ? 'Da Approvare' : 'Notifiche'}
            </h2>
         </div>
         <div className="overflow-y-auto flex-1 p-2 space-y-2 relative">
            {isLoading && (
                <div className="absolute inset-0 bg-white/80 z-10 flex items-center justify-center">
                    <Loader2 className="w-8 h-8 animate-spin text-green-600" />
                </div>
            )}
            {!isLoading && filteredNotifications.length === 0 ? (
               <div className="text-center py-10 text-gray-400">Tutto pulito! Nessuna notifica.</div>
            ) : (
               filteredNotifications.map(notification => {
                 // <--- MODIFICA: Capiamo se è una rivendicazione --->
                 // Controlliamo se esiste pendingOwnerId o proprietarioInAttesa
                 const isClaim = !!(notification.pendingOwnerId || notification.proprietarioInAttesa);
                 // -------------------------------------------------

                 return (
                 <button
                   key={notification.id}
                   onClick={() => setSelectedId(notification.id)}
                   className={`w-full text-left p-4 rounded-xl transition-all border border-transparent
                     ${selectedId === notification.id 
                       ? (isClaim ? 'bg-orange-50 border-orange-200 ring-1 ring-orange-300' : 'bg-green-50 border-green-200 ring-1 ring-green-300')
                       : 'hover:bg-gray-50'
                     }
                   `}
                 >
                   <div className="flex justify-between items-start mb-1">
                      {/* ETICHETTA DIFFERENZIATA */}
                      {isClaim ? (
                          <span className="bg-orange-100 text-orange-700 px-2 py-0.5 rounded text-[10px] font-bold uppercase flex items-center gap-1">
                              <UserCheck className="w-3 h-3"/> Rivendicazione
                          </span>
                      ) : (
                          <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded text-[10px] font-bold uppercase">
                              Nuovo Negozio
                          </span>
                      )}
                      
                      <span className="text-xs text-gray-400">{notification.date}</span>
                   </div>
                   <h3 className="text-sm font-bold text-gray-900 mb-1 line-clamp-1">{notification.title || notification.name}</h3>
                   <p className="text-xs text-gray-500 line-clamp-2">{notification.previewText || notification.address}</p>
                 </button>
               )})
            )}
         </div>
      </div>


      {/* COLONNA DESTRA: Dettaglio */}
      <div className={`w-full md:w-2/3 bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden flex flex-col ${!selectedId ? 'hidden md:flex' : 'flex'}`}>
         
         {selectedNotification ? (
            // Logic to calculate isClaim inside render
            (() => {
                const isClaim = !!(selectedNotification.pendingOwnerId || selectedNotification.proprietarioInAttesa);

                return (
                <div className="flex-1 overflow-y-auto p-6 md:p-10">
                 
                 {/* Header dettaglio */}
                 <div className="mb-6 flex items-center gap-3">
                    <div className={`${isClaim ? 'bg-orange-100' : 'bg-green-100'} p-3 rounded-full`}>
                        <Store className={`w-8 h-8 ${isClaim ? 'text-orange-600' : 'text-green-600'}`} />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">{selectedNotification.shopName || selectedNotification.name}</h1>
                        <p className="text-sm text-gray-500">ID: {selectedNotification.id}</p>
                    </div>
                 </div>

                 {/* <--- MODIFICA: ALERT VISIVO SE È RIVENDICAZIONE ---> */}
                 {isClaim && (
                     <div className="bg-orange-50 border border-orange-200 p-4 rounded-xl mb-6">
                         <h3 className="text-orange-800 font-bold mb-1 flex items-center gap-2">
                             ⚡ Richiesta di Proprietà
                         </h3>
                         <p className="text-sm text-orange-700">
                             Un utente ha richiesto di rivendicare questa attività esistente. 
                             Clicca su <b>Verifica</b> per aprire il modale e accettare la richiesta.
                         </p>
                     </div>
                 )}
                 {/* ------------------------------------------------ */}

                 {/* Dati del negozio */}
                 <div className="bg-gray-50 border border-gray-200 rounded-xl p-6 mb-8">
                     <h3 className="text-gray-900 font-bold mb-4">Dati Attività:</h3>
                     <ul className="space-y-3 text-sm text-gray-700">
                         <li><strong>Categoria:</strong> {selectedNotification.previewText || selectedNotification.category}</li>
                         {/* Se è rivendicazione mostriamo chi la chiede, altrimenti chi ha creato */}
                         <li>
                             <strong>{isClaim ? 'Richiesto da ID:' : 'Creato da ID:'}</strong> 
                             {' '}{selectedNotification.pendingOwnerId || selectedNotification.proprietarioInAttesa || selectedNotification.reporterId || "Anonimo"}
                         </li>
                     </ul>
                     
                     {selectedNotification.imageUrl && (
                         <div className="mt-4">
                             <p className="text-xs font-bold mb-1">Licenza / Foto caricata:</p>
                             <img src={selectedNotification.imageUrl} alt="Prova" className="h-40 rounded border border-gray-300 object-cover" />
                         </div>
                     )}
                 </div>

                 <p className="mb-8 text-gray-600">
                     Clicca su <b>Verifica e Pubblica</b> per aprire il pannello di controllo, revisionare i dati e confermare l'operazione.
                 </p>

                 {/* ACTION BUTTONS */}
                 <div className="flex flex-col md:flex-row gap-4 pt-4 border-t border-gray-100">
                      
                      {/* Bottone APPROVA (Apre il Modal) */}
                      <button 
                        onClick={() => handleOpenApproveModal(selectedNotification)}
                        className={`flex-1 text-white px-6 py-4 rounded-xl font-bold shadow-md flex items-center justify-center gap-2 text-lg transition-transform hover:scale-105
                            ${isClaim ? 'bg-orange-500 hover:bg-orange-600' : 'bg-green-600 hover:bg-green-700'}
                        `}
                      >
                         <CheckCircle className="w-6 h-6" /> {isClaim ? 'Esamina Richiesta' : 'Verifica e Pubblica'}
                      </button>

                      {/* Bottone RESPINGI (Cancella) */}
                      <button 
                         onClick={() => handleReject(selectedNotification.id)}
                         className="flex-1 bg-white border-2 border-red-100 text-red-600 hover:bg-red-50 px-6 py-4 rounded-xl font-bold flex items-center justify-center gap-2 text-lg transition-colors"
                      >
                         <XCircle className="w-6 h-6" /> Rifiuta
                      </button>
                 </div>
            </div>
            );
            })()
         ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-gray-400">
               <Store className="w-16 h-16 mb-4 opacity-20" />
               <p className="text-lg font-medium">Seleziona una notifica per gestirla</p>
            </div>
         )}
      </div>

      {/* IL MODALE DI MODIFICA (Che usiamo per approvare) */}
      <EditShopModal
        shop={shopToApprove}
        isOpen={!!shopToApprove}
        onClose={() => setShopToApprove(null)}
        onUpdate={handleShopApproved}
        userRole={userRole}
        // Passiamo l'ID dell'operatore se serve, ma qui non è critico
      />

    </div>
  );
};

export default Notifications;
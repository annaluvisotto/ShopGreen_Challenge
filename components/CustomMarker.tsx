import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { Shop, ShopStatus, UserRole } from '../types';
import { 
  Heart, ThumbsUp, 
  MessageSquare, Send, Edit2, Flag, ArrowLeft, AlertTriangle, Clock, Sparkles
} from 'lucide-react';

const getMarkerColor = (status: ShopStatus): string => {
  switch (status) {
    case ShopStatus.OPEN: return '#16a34a'; 
    case ShopStatus.OPENING_SOON: return '#eab308';
    case ShopStatus.CLOSED: return '#dc2626';
    case ShopStatus.UNVERIFIED: default: return '#6b7280';
  }
};

const getIconHtml = (color: string) => `
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="${color}" stroke="#ffffff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-10 h-10 drop-shadow-md">
    <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/>
    <circle cx="12" cy="10" r="3" fill="white"/>
  </svg>
`;

const createIcon = (status: ShopStatus) => {
  return new L.DivIcon({
    html: getIconHtml(getMarkerColor(status)),
    className: 'bg-transparent',
    iconSize: [40, 40],
    iconAnchor: [20, 40],
    popupAnchor: [0, -40]
  });
};

interface CustomMarkerProps {
  shop: Shop;
  userRole: UserRole;
  userName?: string | null;
  isFavorite: boolean;
  onToggleFavorite: (id: string) => void;
  onVerify: (id: string, isPositive: boolean) => void;
  onAddReview: (id: string, comment: string) => void;
  onEditClick?: (shop: Shop) => void;
  forceOpen?: boolean;
}

const CustomMarker: React.FC<CustomMarkerProps> = ({ 
  shop, 
  userRole, 
  userName, 
  isFavorite, 
  onToggleFavorite, 
  onVerify,
  onAddReview,
  onEditClick,
  forceOpen
}) => {
  const map = useMap();
  const markerRef = useRef<L.Marker>(null);
  
  const [newComment, setNewComment] = useState('');
  
  const [isReportMode, setIsReportMode] = useState(false);
  const [reportReason, setReportReason] = useState<string>('');
  const [reportDetail, setReportDetail] = useState('');
  const [reportSubmitted, setReportSubmitted] = useState(false);

  const icon = useMemo(() => createIcon(shop.status), [shop.status]);

  useEffect(() => {
    if (forceOpen && markerRef.current) {
      markerRef.current.openPopup();
      centerMap();
    }
  }, [forceOpen, map, shop.coordinates]);

  const centerMap = () => {
      const currentZoom = map.getZoom();
      const mapHeight = map.getSize().y;
      const offset = mapHeight * 0.40;

      const targetPoint = map.project([shop.coordinates.lat, shop.coordinates.lng], currentZoom);
      targetPoint.y -= offset; 
      const newCenter = map.unproject(targetPoint, currentZoom);
      map.setView(newCenter, currentZoom, { animate: true, duration: 0.5 });
  };

  const handleCommentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation(); 
    if (newComment.trim()) {
      onAddReview(shop.id, newComment);
      setNewComment('');
    }
  };

  const handleReportSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    console.log("Report Sent:", { shopId: shop.id, reason: reportReason, detail: reportDetail });
    setReportSubmitted(true);
    setTimeout(() => {
      setIsReportMode(false);
      setReportSubmitted(false);
      setReportReason('');
      setReportDetail('');
    }, 2000);
  };

  const userHasVoted = userName && shop.votes && shop.votes[userName];
  const userVote = userHasVoted ? shop.votes[userName] : null;

  const googleMapsUrl = shop.googleMapsLink || `https://www.google.com/maps/search/?api=1&query=${shop.coordinates.lat},${shop.coordinates.lng}`;
  const iosMapsUrl = shop.iosMapsLink || `http://maps.apple.com/?q=${shop.coordinates.lat},${shop.coordinates.lng}`;

  const getStatusLabel = () => {
    if (shop.status === ShopStatus.OPEN) return { text: 'Sostenibilità verificata', color: 'bg-green-600' };
    if (shop.status === ShopStatus.CLOSED) return { text: 'Sostenibilità verificata', color: 'bg-green-600' };
    if (shop.status === ShopStatus.OPENING_SOON) return { text: "Sostenibilità verificata", color: 'bg-green-600'};
    return { text: 'Sostenibilità non verificata', color: 'bg-gray-500' };
  };

  const statusLabel = getStatusLabel();

  const canEdit = 
    userRole === UserRole.OPERATOR || 
    (userName && shop.ownerId === userName);

  return (
    <Marker 
      ref={markerRef}
      position={[shop.coordinates.lat, shop.coordinates.lng]} 
      icon={icon}
    eventHandlers={{
    click: (e) => {
      const map = e.target._map;
      const targetZoom = 16; 
      const targetLatLng = e.target.getLatLng();
      const mapHeightInPixels = map.getSize().y;
      const offsetPixelsY = mapHeightInPixels * 0.4;
      const pointInPixels = map.project(targetLatLng, targetZoom);
      const newCenterPointInPixels = pointInPixels.subtract([0, offsetPixelsY]);
      const newCenterLatLng = map.unproject(newCenterPointInPixels, targetZoom);
      map.flyTo(newCenterLatLng, targetZoom, {
        duration: 1.2
      });
    },
  }}
    >
      <Popup 
        className="shop-popup p-0 border-none rounded-xl overflow-hidden shadow-xl" 
        maxWidth={350} 
        minWidth={320} 
        closeButton={false}
        autoPan={false}
      >
        <div className="flex flex-col w-full bg-white rounded-xl overflow-hidden max-h-[500px] overflow-y-auto">
          
          {isReportMode ? (
            <div className="p-5 flex flex-col h-full animate-in fade-in slide-in-from-right duration-300">
               <div className="flex items-center gap-2 mb-4">
                 <button 
                   type="button"
                   onClick={(e) => {
                       e.stopPropagation();
                       setIsReportMode(false);
                   }} 
                   className="p-1 hover:bg-gray-100 rounded-full"
                 >
                   <ArrowLeft className="w-5 h-5 text-gray-600" />
                 </button>
                 <h3 className="text-lg font-bold text-gray-900">Segnala Problema</h3>
               </div>

               {!reportSubmitted ? (
                 <form onSubmit={handleReportSubmit} className="flex-1 flex flex-col gap-3">
                    
                    <label className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                        <input 
                          type="radio" 
                          name="reason" 
                          value="closed" 
                          checked={reportReason === 'closed'}
                          onChange={(e) => setReportReason(e.target.value)}
                          className="text-red-600 focus:ring-red-500"
                        />
                        <span className="text-sm font-medium">Attività chiusa</span>
                    </label>
                    
                    <label className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                        <input 
                          type="radio" 
                          name="reason" 
                          value="sustainability" 
                          checked={reportReason === 'sustainability'}
                          onChange={(e) => setReportReason(e.target.value)}
                          className="text-red-600 focus:ring-red-500"
                        />
                        <span className="text-sm font-medium">Mancato rispetto delle norme di sostenibilità</span>
                    </label>

                    <label className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                        <input 
                          type="radio" 
                          name="reason" 
                          value="data_error" 
                          checked={reportReason === 'data_error'}
                          onChange={(e) => setReportReason(e.target.value)}
                          className="text-red-600 focus:ring-red-500"
                        />
                        <span className="text-sm font-medium">Dati errati</span>
                    </label>

                    {(reportReason === 'data_error' || reportReason === 'sustainability') && (
                       <div className="animate-in fade-in zoom-in duration-200 mt-1">
                          <label className="text-xs font-bold text-gray-700 block mb-1">
                             Dettagli:
                          </label>
                          <textarea 
                             required
                             className="w-full border rounded-lg p-2 text-sm focus:ring-2 focus:ring-red-500 outline-none"
                             rows={3}
                             value={reportDetail}
                             onChange={(e) => setReportDetail(e.target.value)}
                             placeholder="Descrivi il problema..."
                          />
                       </div>
                    )}

                    <button 
                      type="submit" 
                      disabled={!reportReason}
                      className="mt-4 w-full bg-red-600 text-white font-bold py-3 rounded-xl shadow hover:bg-red-700 disabled:opacity-50 transition-colors"
                    >
                      Invia Segnalazione
                    </button>
                 </form>
               ) : (
                 <div className="flex-1 flex flex-col items-center justify-center text-center py-10">
                    <AlertTriangle className="w-12 h-12 text-green-600 mb-2" />
                    <h4 className="text-xl font-bold text-gray-900">Grazie!</h4>
                    <p className="text-gray-500 text-sm">Segnalazione inviata con successo!</p>
                 </div>
               )}
            </div>
          ) : (
            
            <div className="p-5">
                <div className="flex justify-between items-start mb-2">
                    <h3 className="text-xl font-extrabold text-gray-900 m-0 leading-tight pr-2">{shop.name}</h3>
                    <span className={`${statusLabel.color} text-white text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wider shrink-0 whitespace-nowrap`}>
                      {statusLabel.text}
                    </span>
                </div>

              {(userRole === UserRole.OPERATOR || (userName && shop.ownerId === userName)) && onEditClick && (
                  <button 
                      type="button"
                      onClick={(e) => {
                          e.stopPropagation();
                          onEditClick(shop);
                      }}
                      className="text-xs text-blue-600 font-bold hover:underline mb-3 flex items-center gap-1"
                  >
                      <Edit2 className="w-3 h-3"/> Modifica scheda
                  </button>
              )}

                <p className="text-sm text-gray-500 font-medium mb-3 border-b border-gray-100 pb-2 capitalize">
                    {shop.categories?.[0] || 'Categoria non specificata'}
                </p>
                        <div className="mb-4 bg-gray-50 p-2 rounded-lg border border-gray-100 flex items-start gap-2">
                
                <Clock className="w-4 h-4 text-green-600 mt-0.5 shrink-0" />
                <div className="text-xs text-gray-600 whitespace-pre-line leading-relaxed">
                    
                    {shop.hours || "Orari non disponibili"}
                </div>
                </div>

                {shop.website && (
                  <div className="mb-5">
                    <a 
                      href={shop.website} 
                      target="_blank" 
                      rel="noreferrer"
                      className="text-sm text-green-700 hover:underline font-medium break-all"
                    >
                      link al sito: {shop.website.replace(/^https?:\/\//, '')}
                    </a>
                  </div>
                )}

                <div className="flex gap-3 mb-6">
                   <a href={iosMapsUrl} target="_blank" rel="noreferrer" className="flex-1 py-2 px-3 bg-white border border-gray-300 rounded-full text-center text-sm font-bold text-gray-700 hover:bg-gray-50 transition-colors">
                     Mappe
                   </a>
                   <a href={googleMapsUrl} target="_blank" rel="noreferrer" className="flex-1 py-2 px-3 bg-white border border-gray-300 rounded-full text-center text-sm font-bold text-gray-700 hover:bg-gray-50 transition-colors">
                     Google maps
                   </a>
                </div>

                {userRole !== UserRole.ANONYMOUS && (
                  <button 
                    type="button"
                    onClick={(e) => {
                        e.stopPropagation();
                        onToggleFavorite(shop.id);
                    }}
                    className={`w-full py-2.5 rounded-lg font-bold text-sm flex items-center justify-center gap-2 mb-6 transition-colors
                      ${isFavorite 
                        ? 'bg-red-50 text-red-600 border border-red-200 hover:bg-red-100' 
                        : 'bg-green-600 text-white hover:bg-green-700 shadow-md'}`}
                  >
                    <Heart className={`w-4 h-4 ${isFavorite ? 'fill-red-600' : ''}`} /> 
                    {isFavorite ? 'Rimuovi dai preferiti' : 'Aggiungi ai preferiti'}
                  </button>
                )}

                {shop.status === ShopStatus.UNVERIFIED && (
          <div className="group bg-gradient-to-r from-emerald-50 to-teal-50 p-5 rounded-2xl border border-emerald-100 shadow-sm mb-6 relative overflow-hidden">
            
            <div className="absolute -right-6 -top-6 w-24 h-24 bg-emerald-100 rounded-full blur-2xl opacity-60"></div>
            
            <div className="flex items-start gap-3 relative z-10 mb-4">
              <div className="bg-white p-2 rounded-full shadow-sm text-emerald-600 shrink-0">
                 <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-emerald-900 mb-1">
                  Verifica Sostenibilità
                </h4>
                <p className="text-xs text-emerald-700/90 leading-relaxed">
                  Pensi che questa attività sia sostenibile? 
                  <span className="font-bold text-emerald-800 mx-1 cursor-pointer hover:underline decoration-emerald-500 underline-offset-2">
                    Scopri le nostre linee guida
                  </span> 
                  e aiutaci a verificarla!
                </p>
              </div>
            </div>

            <div className="relative z-10">
              {userRole !== UserRole.ANONYMOUS ? (
                <div className="flex gap-2">
                  <button 
                    type="button"
                    onClick={(e) => {
                        e.stopPropagation();
                        if (!userHasVoted) onVerify(shop.id, true);
                    }}
                    disabled={!!userHasVoted}
                    className={`flex-1 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 border transition-all shadow-sm
                      ${userVote === 'up' 
                        ? 'bg-emerald-600 text-white border-emerald-600' 
                        : 'bg-white text-emerald-700 border-emerald-200 hover:bg-emerald-50 hover:border-emerald-300'}`}
                  >
                      <ThumbsUp className="w-3 h-3" /> Sì
                  </button>
                  <button 
                    type="button"
                    onClick={(e) => {
                        e.stopPropagation();
                        if (!userHasVoted) onVerify(shop.id, false);
                    }}
                    disabled={!!userHasVoted}
                    className={`flex-1 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 border transition-all shadow-sm
                      ${userVote === 'down' 
                        ? 'bg-rose-500 text-white border-rose-500' 
                        : 'bg-white text-rose-600 border-rose-100 hover:bg-rose-50 hover:border-rose-200'}`}
                  >
                      No
                  </button>
                </div>
              ) : (
                <div className="text-center py-1 bg-white/60 rounded-lg border border-emerald-100/50">
                    <p className="text-xs text-emerald-800 font-medium italic">Accedi per partecipare alla verifica.</p>
                </div>
              )}
            </div>
          </div>
        )}

                <div className="border-t border-gray-100 pt-4 mb-4">
                    <h4 className="text-xs font-bold text-gray-900 mb-2 flex items-center gap-1">
                      <MessageSquare className="w-3 h-3"/> Commenti
                    </h4>
                    
                    {shop.reviews.length > 0 ? (
                      <div className="space-y-2 mb-3 max-h-32 overflow-y-auto pr-1 custom-scrollbar">
                         {shop.reviews.slice().reverse().map((rev) => (
                           <div key={rev.id} className="bg-gray-50 p-2 rounded text-xs text-gray-700">
                              <span className="font-bold">{rev.user}: </span>{rev.comment}
                           </div>
                         ))}
                      </div>
                    ) : (
                      <p className="text-xs text-gray-400 italic mb-3">Nessun commento.</p>
                    )}

                    {userRole !== UserRole.ANONYMOUS && (
                      <form onSubmit={handleCommentSubmit} className="relative">
                        <input 
                          type="text" 
                          placeholder="Scrivi un commento..."
                          className="w-full bg-gray-50 border border-gray-200 rounded-full px-3 py-2 text-xs focus:outline-none focus:border-green-500 pr-8"
                          value={newComment}
                          onChange={e => setNewComment(e.target.value)}
                        />
                        <button 
                            type="submit" 
                            className="absolute right-1 top-1 p-1 text-green-600 hover:text-green-800"
                            disabled={!newComment.trim()}
                        >
                          <Send className="w-3 h-3" />
                        </button>
                      </form>
                    )}
                </div>

                {userRole !== UserRole.ANONYMOUS && (
                  <div className="text-center pt-2 border-t border-gray-100">
                     <button 
                       type="button"
                       onClick={(e) => {
                           e.stopPropagation();
                           e.preventDefault();
                           setIsReportMode(true);
                       }}
                       className="text-xs text-gray-400 hover:text-red-500 hover:underline flex items-center justify-center gap-1 w-full"
                     >
                       <Flag className="w-3 h-3" /> Segnala un problema
                     </button>
                  </div>
                )}
            </div>
          )}
        </div>
      </Popup>
    </Marker>
  );
};

export default CustomMarker;
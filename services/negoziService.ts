import { Shop, ShopCategory, ShopStatus } from '../types';
const API_URL = 'http://localhost:3000/api';

const formatOrariForDisplay = (orariBackend: any): string => {
    if (!orariBackend) return "Orari non disponibili";
    const daysOrder = ['lunedi', 'martedi', 'mercoledi', 'giovedi', 'venerdi', 'sabato', 'domenica'];
    const displayNames: {[key: string]: string} = {
        'lunedi': 'Lun', 'martedi': 'Mar', 'mercoledi': 'Mer',
        'giovedi': 'Gio', 'venerdi': 'Ven', 'sabato': 'Sab', 'domenica': 'Dom'
    };
    let formattedString = "";
    daysOrder.forEach(dayKey => {
        const dayData = orariBackend[dayKey];
        const label = displayNames[dayKey];
        if (!dayData || dayData.chiuso) {
            formattedString += `${label}: Chiuso\n`;
        } else {
            const slotsString = dayData.slot
                .map((s: any) => `${s.apertura}-${s.chiusura}`)
                .join(' / ');
            formattedString += `${label}: ${slotsString}\n`;
        }
    });
    return formattedString.trim();
};

const normalizeCategory = (catDB: string): ShopCategory => {
    if (!catDB) return ShopCategory.OTHER;
    const clean = catDB.toLowerCase().trim();
    if (clean === 'alimenti' || clean === 'food' || clean.includes('aliment')) return ShopCategory.FOOD;
    if (clean === 'vestiario' || clean === 'clothing' || clean.includes('vestit')) return ShopCategory.CLOTHING;
    if (clean.includes('cura') || clean.includes('casa') || clean === 'home_care') return ShopCategory.HOME_CARE;
    const exactMatch = Object.values(ShopCategory).find(c => c === clean);
    if (exactMatch) return exactMatch;
    return ShopCategory.OTHER;
};

const timeToMinutes = (timeStr: string) => {
  const [hours, minutes] = timeStr.split(':').map(Number);
  return hours * 60 + minutes;
};

const isNegozioAperto = (orariDB: any): ShopStatus => {
  if (!orariDB) return ShopStatus.CLOSED;
  
  const now = new Date();
  const currentDayIndex = now.getDay();
  const giorniKeys = ['domenica', 'lunedi', 'martedi', 'mercoledi', 'giovedi', 'venerdi', 'sabato'];
  const orariOggi = orariDB[giorniKeys[currentDayIndex]];

  if (!orariOggi || orariOggi.chiuso) return ShopStatus.CLOSED;

  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const SOGLIA_PREAVVISO = 30;

  if (orariOggi.slot && Array.isArray(orariOggi.slot)) {
      for (const slot of orariOggi.slot) {
        const start = timeToMinutes(slot.apertura);
        const end = timeToMinutes(slot.chiusura);

        if (currentMinutes >= start && currentMinutes < end) {
            return ShopStatus.OPEN;
        }

        if (currentMinutes < start && (start - currentMinutes) <= SOGLIA_PREAVVISO) {
            return ShopStatus.OPENING_SOON; 
        }
      }
  }
  
  return ShopStatus.CLOSED;
};

export const mapNegozio = (dbItem: any): Shop => {
  let statusCalcolato = ShopStatus.UNVERIFIED; 
  
  if (!dbItem.sostenibilitàVerificata) {
      statusCalcolato = ShopStatus.UNVERIFIED; 
  } else {
      statusCalcolato = isNegozioAperto(dbItem.orari);
  }

  const dbCategories: string[] = dbItem.categoria || [];
  const frontendCategories = dbCategories.map(catStr => normalizeCategory(catStr));
  
  if (frontendCategories.length === 0) {
      frontendCategories.push(ShopCategory.OTHER);
  }

  let finalOwnerId: string | undefined = undefined;
  if (dbItem.proprietario) {
      if (typeof dbItem.proprietario === 'object') {
          finalOwnerId = dbItem.proprietario.username || dbItem.proprietario.id || dbItem.proprietario._id?.toString();
      } else {
          finalOwnerId = dbItem.proprietario.toString();
      }
  }

  let pendingId = undefined;
  if (dbItem.proprietarioInAttesa) {
      pendingId = typeof dbItem.proprietarioInAttesa === 'object' 
          ? (dbItem.proprietarioInAttesa._id || dbItem.proprietarioInAttesa.id)
          : dbItem.proprietarioInAttesa.toString();
  }

  const coords = {
      lat: dbItem.coordinate && dbItem.coordinate.length > 0 ? dbItem.coordinate[0] : 0,
      lng: dbItem.coordinate && dbItem.coordinate.length > 1 ? dbItem.coordinate[1] : 0
  };

  return {
    id: dbItem._id,
    name: dbItem.nome,
    categories: frontendCategories,
    status: statusCalcolato,
    description: dbItem.descrizione || "",
    coordinates: coords, 
    hours: formatOrariForDisplay(dbItem.orari),
    rawHours: dbItem.orari, 
    imageUrl: dbItem.licenzaOppureFoto || "",
    website: dbItem.linkSito || "",
    googleMapsLink: dbItem.maps || "",
    iosMapsLink: dbItem.mappe || "",
    sustainabilityScore: dbItem.sostenibilitàVerificata ? 8 : 0,
    votes: {},
    reviews: [],
    ownerId: finalOwnerId,
    pendingOwnerId: pendingId,
    verifiedByOperator: dbItem.verificatoDaOperatore
  };
};

export const getNegozi = async (nome?: string, categoria?:string, verificatoDaOperatore?: boolean, proprietarioInAttesa?: boolean): Promise<Shop[]> => {
  try {
    let url = API_URL + '/negozi';
    const params = new URLSearchParams();
    if (nome) params.append('nome', nome);
    if (categoria && categoria !== 'Tutte') params.append('categoria', categoria);
    if (verificatoDaOperatore !== undefined) params.append('verificatoDaOperatore', String(verificatoDaOperatore));
    if (proprietarioInAttesa === true) params.append('proprietarioInAttesa', 'true');

    if (params.toString()) url += '?' + params.toString();

    const response = await fetch(url, { 
      method: 'GET', 
      headers: { 'Content-Type': 'application/json' } });
    
    const data = await response.json();

    if (!response.ok) {
      const errMess = data.dettagli;
      throw new Error(errMess);
    }
    
    return data.map((item: any) => mapNegozio(item));
  } catch (error) {
    console.error("Errore nel caricamento delle attività:", error);
    throw error;
  }
};

export const getNegozioById = async (negozio_id: string): Promise<Shop> => {
  try {
    const url = API_URL + '/negozi/' + negozio_id;
    const token = localStorage.getItem('token');
    const headers: any = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = 'Bearer ' + token;

    const response = await fetch(url, { method: 'GET', headers: headers });
    if (!response.ok) {
      const errMess = await response.json();
      throw new Error(errMess.dettagli);
    }
    const datoBackend = await response.json();
    return mapNegozio(datoBackend);
  } catch (error) {
    console.error("Errore nella visualizzazione dei dettagli dell'attività:", error);
    throw error;
  }
};

export const createNegozio = async (dati: any): Promise<{success: boolean}> => {
  try{
    const url = API_URL + '/negozi';
    const token = localStorage.getItem('token');
    if (!token) throw new Error("Utente non autenticato");
    
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
      body: JSON.stringify(dati)
    });

    if (!response.ok) {
       const erroreServer = await response.json();
       throw new Error(erroreServer.dettagli)
    }
    return await response.json();
  } catch (error){
    console.error("Errore createNegozio", error);
    throw error;
  }
};

export const deleteNegozio = async (negozio_id: string): Promise<{success: boolean}> => {
  try{
    const url = API_URL + '/negozi/' + negozio_id;
    const token = localStorage.getItem('token');
    if (!token) throw new Error("Utente non autenticato");

    const response = await fetch(url, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
    });

    if (!response.ok) {
       const erroreServer = await response.json();
       throw new Error(erroreServer.dettagli)
    }
    return await response.json();
  } catch (error){
    console.error("Errore deleteNegozio", error);
    throw error;
  }
};

export const updateNegozio = async (negozio_id: string, dati: any): Promise<Shop> => {
  try{
    const url = API_URL + '/negozi/' + negozio_id;
    const token = localStorage.getItem('token');
    if (!token) throw new Error("Utente non autenticato");

    const response = await fetch(url, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
      body: JSON.stringify(dati)
    });

    if (!response.ok) {
       const erroreServer = await response.json();
       throw new Error(erroreServer.dettagli)
    }
    const negozioAggBackend = await response.json();
    return mapNegozio(negozioAggBackend);
  } catch (error){
    console.error("Errore updateNegozio", error);
    throw error;
  }
};
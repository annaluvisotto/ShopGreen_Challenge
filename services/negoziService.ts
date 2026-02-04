import {Shop, ShopCategory, ShopStatus} from '../types';
const API_URL = 'http://localhost:3000/api';

const formatOrariForDisplay = (orariBackend: any): string => {
    if (!orariBackend) return "Orari non disponibili";
    
    // Mappa per ordinare i giorni correttamente
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
            // Uniamo gli slot (es. "09:00-13:00 / 15:30-19:30")
            const slotsString = dayData.slot
                .map((s: any) => `${s.apertura}-${s.chiusura}`)
                .join(' / ');
            formattedString += `${label}: ${slotsString}\n`;
        }
    });

    return formattedString.trim();
};

//funzione per mappare le coordinate da backend (string[]) a frontend (enum[])
const mapCategoryStringToEnum = (catDB: string): ShopCategory => {
    switch (catDB) {
        case "cura della casa e della persona": return ShopCategory.HOME_CARE;
        case "alimenti": return ShopCategory.FOOD;
        case "vestiario": return ShopCategory.CLOTHING;
        default: return ShopCategory.OTHER;
    }
};

//funzioni per calcolare il colore del segnaposto in base agli orari e alla sostenibilità verificata
const timeToMinutes = (timeStr: string) => {
  const [hours, minutes] = timeStr.split(':').map(Number);
  return hours * 60 + minutes;
};

const isNegozioAperto = (orariDB: any): boolean => {
  if (!orariDB) return false;
  const now = new Date();
  const currentDayIndex = now.getDay(); //0 = domenica, 1 = lunedì...
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const giorniKeys = ['domenica', 'lunedi', 'martedi', 'mercoledi', 'giovedi', 'venerdi', 'sabato'];
  const keyOggi = giorniKeys[currentDayIndex];
  const orariOggi = orariDB[keyOggi];
  if (!orariOggi || orariOggi.chiuso) {
    return false;
  }
  if (orariOggi.slot && Array.isArray(orariOggi.slot)) {
      for (const slot of orariOggi.slot) {
        const start = timeToMinutes(slot.apertura);
        const end = timeToMinutes(slot.chiusura);
        if (currentMinutes >= start && currentMinutes <= end) {
          return true; // È aperto in questo momento!
        }
      }
  }
  return false;
};

//funzione per mappare un negozio nel backend in uno shop nel frontend
const mapNegozio = (dbItem: any): Shop => {
  let statusCalcolato = ShopStatus.UNVERIFIED; 

  // LOGICA COLORI (Invariata come volevi tu)
  if (!dbItem.sostenibilitàVerificata) {
      statusCalcolato = ShopStatus.UNVERIFIED; // Grigio
  } else {
      // Nota: Assicurati che isNegozioAperto gestisca la struttura complessa degli orari
      if (isNegozioAperto(dbItem.orari)) {
          statusCalcolato = ShopStatus.OPEN; // Verde
      } else {
          statusCalcolato = ShopStatus.CLOSED; // Rosso
      }
  }

  // MAPPING CATEGORIE
  // Il DB restituisce un array di stringhe. Le convertiamo in Enum.
  const dbCategories: string[] = dbItem.categoria || [];
  const frontendCategories = dbCategories.map(catStr => mapCategoryStringToEnum(catStr));
  
  // Fallback se vuoto
  if (frontendCategories.length === 0) {
      frontendCategories.push(ShopCategory.OTHER);
  }

  let finalOwnerId: string | undefined = undefined;

  if (dbItem.proprietario) {
      // DEBUG: Vediamo cosa diavolo arriva dal backend
      console.log(`[MAPPER] Negozio: ${dbItem.nome}`);
      console.log(`[MAPPER] Raw Proprietario:`, dbItem.proprietario);

      if (typeof dbItem.proprietario === 'object') {
          // CASO 1: Il backend ha fatto 'populate'. Abbiamo un oggetto utente intero.
          // Cerchiamo lo username. Se non c'è, proviamo id o _id.
          finalOwnerId = dbItem.proprietario.username || dbItem.proprietario.id || dbItem.proprietario._id?.toString();
      } else {
          // CASO 2: È una stringa semplice (es. l'ID o lo username salvato direttamente)
          finalOwnerId = dbItem.proprietario.toString();
      }
      
      console.log(`[MAPPER] Owner Mapped To:`, finalOwnerId);
  }

  let pendingId = undefined;
  if (dbItem.proprietarioInAttesa) {
      pendingId = typeof dbItem.proprietarioInAttesa === 'object' 
          ? (dbItem.proprietarioInAttesa._id || dbItem.proprietarioInAttesa.id)
          : dbItem.proprietarioInAttesa.toString();
  }


  return {
    id: dbItem._id,
    name: dbItem.nome,
    categories: frontendCategories,
    status: statusCalcolato,
    description: dbItem.descrizione || "",
    
    coordinates: {
        // Usiamo ?. per evitare crash se coordinate è null
        lat: dbItem.coordinate?.[0] || 0,
        lng: dbItem.coordinate?.[1] || 0
    },
    
    hours: formatOrariForDisplay(dbItem.orari),
    
    // [IMPORTANTE] rawHours serve all'EditShopModal per pre-compilare i campi!
    rawHours: dbItem.orari, 

    imageUrl: dbItem.licenzaOppureFoto || "",
    website: dbItem.linkSito || "",
    googleMapsLink: dbItem.maps || "",
    iosMapsLink: dbItem.mappe || "",
    
    // Se usi il punteggio reale dal DB usa quello, altrimenti la logica fissa 8/0 va bene per ora
    sustainabilityScore: dbItem.sostenibilitàVerificata ? 8 : 0,
    
    votes: {},
    reviews: [],
    
    ownerId: finalOwnerId,
    pendingOwnerId: pendingId
  };
};


//ricerca dei negozi nella mappa / visualizzazione delle segnalazioni nella sezione degli operatori
export const getNegozi = async (nome?: string, categoria?:string, verificatoDaOperatore?: boolean): Promise<Shop[]> => {
  try {
    let url = API_URL + '/negozi';
    const params = new URLSearchParams();

    if (nome) params.append('nome', nome);
    if (categoria && categoria !== 'Tutte') {
        params.append('categoria', categoria);
    }
    if (verificatoDaOperatore !== undefined) { //perchè verificato=true serve agli utenti, verificato=false serve agli operatori per le segnalazioni
        params.append('verificatoDaOperatore', String(verificatoDaOperatore));
    }
    if (params.toString()) {
        url += '?' + params.toString();
    }

    const response = await fetch(url, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });
    if (!response.ok) {
      const erroreServer = await response.json();
      throw new Error(erroreServer.dettagli);
    }
    const datiBackend = await response.json();
    
    /**prende l'array di negozi dal backend e lo trasforma
    in un array di oggetti Shop per il frontend, usando la funzione 
    mapNegozio scritta sopra**/
    return datiBackend.map((item: any) => mapNegozio(item));
  } 
  catch (error) {
    console.error("Errore nella visualizzazione dei negozi", error);
    throw error;
  }
};

//visualizzazione del pop-up relativo ad un negozio / il form della segnalazione modificabile dall'operatore (notifica)
export const getNegozioById = async (negozio_id: string): Promise<Shop> => {
  try {
    const url = API_URL + '/negozi/' + negozio_id;
    const token = localStorage.getItem('token'); //cerco il token
    const headers: any = {
      'Content-Type': 'application/json'
    };
    //se il token c'è lo aggiungo (nel backend abbiamo usato tokenCheckerOptional)
    if (token) {
      headers['Authorization'] = 'Bearer ' + token;
    }

    const response = await fetch(url, {
      method: 'GET',
      headers: headers
    });
    if (!response.ok) {
      const erroreServer = await response.json();
      throw new Error(erroreServer.dettagli);
    }
    const datoBackend = await response.json();
    return mapNegozio(datoBackend);
  } 
  catch (error) {
    console.error("Errore nella visualizzazione dei dettagli di un negozio o segnalazione", error);
    throw error;
  }
};

export const createNegozio = async (dati: any): Promise<{success: boolean}> => {
  try{
    const url = API_URL + '/negozi';
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error("Utente non autenticato");
    }
    const headers: any = {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + token
    };

    const response = await fetch(url, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify(dati)
    });

    if (!response.ok) {
       const erroreServer = await response.json();
       throw new Error(erroreServer.dettagli)
    }
    return await response.json();
  }
  catch (error){
    console.error("Errore nella creazione di un negozio", error);
    throw error;
  }
};

export const deleteNegozio = async (negozio_id: string): Promise<{success: boolean}> => {
  try{
    const url = API_URL + '/negozi/' + negozio_id;
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error("Utente non autenticato");
    }
    const headers: any = {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + token
    };

    const response = await fetch(url, {
      method: 'DELETE',
      headers: headers,
    });

    if (!response.ok) {
       const erroreServer = await response.json();
       throw new Error(erroreServer.dettagli)
    }
    return await response.json();
  }
  catch (error){
    console.error("Errore nell'eliminazione di un negozio", error);
    throw error;
  }
};

export const updateNegozio = async (negozio_id: string, dati: any): Promise<Shop> => {
  try{
    const url = API_URL + '/negozi/' + negozio_id;
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error("Utente non autenticato");
    }
    const headers: any = {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + token
    };

    const response = await fetch(url, {
      method: 'PUT',
      headers: headers,
      body: JSON.stringify(dati)
    });

    if (!response.ok) {
       const erroreServer = await response.json();
       throw new Error(erroreServer.dettagli)
    }
    const negozioAggBackend = await response.json();
    return mapNegozio(negozioAggBackend);
  }
  catch (error){
    console.error("Errore nella modifica di un negozio", error);
    throw error;
  }
};

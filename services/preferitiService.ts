import { Shop, ShopStatus, ShopFavorite } from '../types';
import { isNegozioAperto } from './negoziService';

//const API_URL = 'http://localhost:3000/api/preferiti/users';
const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
const API_URL = `${BASE_URL}/api/preferiti/users`;

export const mapPreferito = (dbItem: any): ShopFavorite => {
  let statusCalcolato = ShopStatus.UNVERIFIED; 
  
  if (!dbItem.sostenibilitàVerificata) {
      statusCalcolato = ShopStatus.UNVERIFIED; 
  } else {
      statusCalcolato = isNegozioAperto(dbItem.orari);
  }
  const coords = {
      lat: dbItem.coordinate && dbItem.coordinate.length > 0 ? dbItem.coordinate[0] : 0,
      lng: dbItem.coordinate && dbItem.coordinate.length > 1 ? dbItem.coordinate[1] : 0
  };
  return {
    id: dbItem._id,
    name: dbItem.nome,
    status: statusCalcolato,
    coordinates: coords
  };
};

export const getPreferiti = async (user_id: string): Promise<ShopFavorite[]> => {
  try {
    let url = API_URL + '/' + user_id;
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error("Token mancante. Utente non autenticato.");
    }

    const headers: any = {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + token
    };

    const response = await fetch(url, {
      method: 'GET',
      headers: headers 
    });

    const data = await response.json();

    if (!response.ok) {
      const errMess = data.dettagli;
      throw new Error(errMess);
    }
    return data.map((item: any) => mapPreferito(item));
  } 
  catch (error) {
    console.error("Errore nella visualizzazione dei preferiti:", error);
    throw error;
  }
};

export const addPreferito = async (user_id: string, negozio_id: any): Promise<{success: boolean}> => {
  try {
    let url = API_URL + '/' + user_id;
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
      body: JSON.stringify({negozio_id: negozio_id})
    });

    if (!response.ok) {
      const erroreServer = await response.json();
      throw new Error(erroreServer.dettagli);
    }
    return await response.json();
  } 
  catch (error) {
    console.error("Errore nell'aggiunta del negozio ai preferiti:", error);
    throw error;
  }
};

export const deletePreferito = async (user_id: string, negozio_id: string): Promise<void> => {
  try {
    let url = API_URL + '/' + user_id + '?negozio_id=' + negozio_id;
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
      headers: headers
    });

    if (response.status === 204) {
        return; 
    }
    const data = await response.json();

    if (!response.ok) {
      const errMess = data.dettagli || "Errore sconosciuto";
      throw new Error(errMess);
    }
    
    return;
  } 
  catch (error) {
    console.error("Errore nell'eliminazione del negozio ai preferiti:", error);
    throw error;
  }
};
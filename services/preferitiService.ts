import { Negozio } from './negoziService';
const API_URL = 'http://localhost:3000/api/preferiti/users';

export const getPreferiti = async (user_id: string): Promise<Negozio[]> => {
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
      method: 'GET',
      headers: headers 
    });

    if (!response.ok) {
      const erroreServer = await response.json();
      throw new Error(erroreServer.dettagli);
    }
    return await response.json();
  } 
  catch (error) {
    console.error("Errore nella visualizzazione dei preferiti", error);
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
    console.error("Errore nell'aggiunta del negozio ai preferiti", error);
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

    if (!response.ok) {
      const erroreServer = await response.json();
      throw new Error(erroreServer.dettagli);
    }
    return;
  } 
  catch (error) {
    console.error("Errore nell'eliminazione del negozio ai preferiti", error);
    throw error;
  }
};
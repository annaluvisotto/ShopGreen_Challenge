const API_URL = 'http://localhost:3000/api';

export interface Negozio {
    _id: string;
    nome: string;
    coordinate: number[];
    categoria: string[];
    orari?: any;
    linkSito?: string;
    maps?: string;
    mappe?: string;
    licenzaOppureFoto: string;
    verificatoDaOperatore: boolean;
    sostenibilitàVerificata: boolean;
    proprietario?: string;
}

//ricerca dei negozi nella mappa / visualizzazione delle segnalazioni nella sezione degli operatori
export const getNegozi = async (nome?: string, categoria?: string, verificatoDaOperatore?: boolean): Promise<Negozio[]> => {
  try {
    let url = API_URL + '/negozi';
    const params = new URLSearchParams();

    if (nome) params.append('nome', nome);
    if (categoria) params.append('categoria',categoria)
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
    return await response.json();
  } 
  catch (error) {
    console.error("Errore nella visualizzazione dei negozi", error);
    throw error;
  }
};

//visualizzazione del pop-up relativo ad un negozio / il form della segnalazione modificabile dall'operatore (notifica)
export const getNegozioById = async (negozio_id: string): Promise<Negozio> => {
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
    return await response.json();
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

export const deleteNegozio = async (id: string): Promise<{success: boolean}> => {
  try{
    const url = API_URL + '/negozi/' + id;
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

export const updateNegozio = async (id: string, dati: any): Promise<Negozio> => {
  try{
    const url = API_URL + '/negozi/' + id;
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
    return await response.json();
  }
  catch (error){
    console.error("Errore nella modifica di un negozio", error);
    throw error;
  }
};

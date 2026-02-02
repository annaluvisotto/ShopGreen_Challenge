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
      throw new Error('Errore nel recupero dei negozi');
    }
    return await response.json();
  } 
  catch (error) {
    console.error("Errore nella visualizzazione dei negozi", error);
    throw error;
  }
};

//visualizzazione del pop-up relativo ad un negozio
export const getNegozioById = async (negozio_id: string): Promise<Negozio> => {
  try {
    const url = API_URL + '/negozi/' + negozio_id;
    const token = localStorage.getItem('token'); //cerco il token
    const headers: any = {
      'Content-Type': 'application/json'
    };
    //se il token c'è lo aggiungo
    if (token) {
      headers['Authorization'] = 'Bearer ' + token;
    }

    const response = await fetch(url, {
      method: 'GET',
      headers: headers
    });
    if (!response.ok) {
      throw new Error('Errore nel recupero del negozio');
    }
    return await response.json();
  } 
  catch (error) {
    console.error("Errore nella visualizzazione dei dettagli di un negozio o segnalazione", error);
    throw error;
  }
};
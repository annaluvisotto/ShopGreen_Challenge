const API_URL = 'http://localhost:3000/api/feedback';

export interface Feedback {
  _id: string;
  autore: string;
  negozio: string;
  feedback: boolean;
}

export interface FeedbackResponse {
  successo: boolean; 
  feedback: Feedback[];
}

export const getFeedback = async (negozio_id: string): Promise<FeedbackResponse | null> => {
  try {
    let url = API_URL + '?negozio_id=' + negozio_id;
    const token = localStorage.getItem('token');
    if (!token) { //se l'utente non è loggato, non avrà alcun feedback associato
      return null;
    }

    const headers: any = {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + token
    };

    const response = await fetch(url, {
      method: 'GET',
      headers: headers
    });

    if (response.status===404) { //se l'utente non ha ancora votato
      return null;
    }

    if (!response.ok) {
       const erroreServer = await response.json();
       throw new Error(erroreServer.dettagli)
    }
    return await response.json();
  }
  catch (error){
    console.error("Errore nella visualizzazione del feedback", error);
    return null;
  }
};

export const sendFeedback = async (negozio_id: string, voto: boolean): Promise<any> => {
  try {
    let url = API_URL;
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
      body: JSON.stringify({
        negozio: negozio_id,
        feedback: voto
    })
    });

    if (!response.ok) {
       const erroreServer = await response.json();
       if (response.status === 409) {
          throw new Error("Hai già votato per questo negozio!");
       }
       throw new Error(erroreServer.dettagli)
    }
    return await response.json();
  }
  catch (error){
    console.error("Errore nell'invio del feedback", error);
    throw error;
  }
};


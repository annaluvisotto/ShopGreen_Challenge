import { UserRole } from '../types';

//dopo il login avro questi dati:
interface UserData {
  role: UserRole;
  name: string;
  token: string;
  id: string;
}

const mappingRole = (roleString?: string): UserRole => {
  switch (roleString) {
    case 'operatore':
      return UserRole.OPERATOR;
    case 'utente':
      return UserRole.USER;
    default:
      return UserRole.USER;
  }
};

const API_URL = 'http://localhost:3000';

export const login = async (body: {}, google = false): Promise<UserData> => { //Promise<UserData> questo permette di restituire un ogg. ti tipo UserData
  
  try {
    
    const response = await fetch(`${API_URL}/api/auth/login`, {
      method: 'POST',
      headers: {'Content-Type': 'application/json'}, //questo significa che avviso il server che sto inviando JSON
      body: JSON.stringify(body), //per trovare l'utente gli invio username e passoword
    });

    //controllo che il ritorno sia un json (se no crasha il frontend)
    const contentType = response.headers.get("content-type");
    if (!contentType || !contentType.includes("application/json")) {
       throw new Error("E' stato tornato un HTML invece di un JSON");
    }

    const data = await response.json(); //riconverto stringa ricevuta

    if (!response.ok || !data.success) { //data.success è nel body della risposta, mentre response.ok è per il controllo del codice http
      const errMess = data.dettagli;
      throw new Error(errMess);
    }
    
    localStorage.setItem('token', data.token); //salvo il token nella memoria del browser per tenerlo anche nella altre pagine
    localStorage.setItem('username', data.username); 
    localStorage.setItem('role', mappingRole(data.ruolo));
    localStorage.setItem('userId', data.id);

    return {
      role: mappingRole(data.ruolo),
      name: data.username,
      token: data.token,
      id: data.id
    };

  } catch (error: any) {
    console.error("Errore durante il login:", error);
    throw error;
  }
};

//registrazione, non nelle api ma implementata
export const register = async (username: string, password: string, email: string, role: UserRole): Promise<{ success: boolean; titolo: string, dettagli: string }> => {
  try {
   
    //trasformo ruolo in stringe per mandarle a mongoDB
    let roleString = 'utente';
    if (role === UserRole.OPERATOR) roleString = 'operatore';

    const response = await fetch(`${API_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        username, 
        password, 
        email, 
        ruolo: roleString 
      }),
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
      const errMess = data.dettagli;
      throw new Error(errMess);
    }

    return {
      success: true,
      titolo: data.titolo, //mex: "email di conferma inviata"
      dettagli: data.dettagli
    };

  } catch (error: any) {
    console.error("Errore durante la registrazione:", error);
    throw error;
  }
};
import { UserRole } from '../types';

//dopo il login avro questi dati:
interface UserData {
  role: UserRole;
  name: string;
  token: string;
  id: string;
}

// per trasformare le string di mongoDB in Enum su types
const mappingRole = (roleString?: string): UserRole => {
  switch (roleString) {
    case 'operatore':
      return UserRole.OPERATOR;
    case 'venditore':
      return UserRole.SELLER;
    case 'utente':
      return UserRole.USER;
    default:
      //per sicurezza se c'è quanche errore metto per default user 
      return UserRole.USER;
  }
};

const API_URL = 'http://localhost:3000'; //indirizzo server

// LOGIN
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
       throw new Error("Endpoint returned HTML instead of JSON.");
    }

    const data = await response.json(); //riconverto stringa ricevuta

    if (!response.ok || !data.success) { //data.success è nel body della risposta, mentreresponse.ok è per il controllo del codice http
       throw new Error(data.message || 'Login failed from server');
    }

    //per debugging
    console.log("TOKEN RICEVUTO DAL SERVER:", data.token);
    
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
    console.error("login error", error);
    throw error;
    
  }
};

// In authService.ts

// REGISTRAZIONE
export const register = async (username: string, password: string, email: string, role: UserRole): Promise<{ success: boolean; message: string }> => {
  try {
   
    //trasformo ruolo in stringe per mandarle a mongoDB
    let roleString = 'utente';
    if (role === UserRole.SELLER) roleString = 'venditore';
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
       throw new Error(data.message || 'Registration failed');
    }

    return {
      success: true,
      message: data.message //mex: "email di conferma inviata"
    };

  } catch (error: any) {
    console.error("Registration error:", error);
    throw error;
  }
};
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { login, register } from '../services/authService';
import { UserRole } from '../types';
import { User, ShoppingBag, ShieldCheck, Mail, CheckCircle, ArrowLeft } from 'lucide-react';

interface LoginProps {
  onLoginSuccess: (user: { role: UserRole; name: string }) => void;
}

declare global {
  interface Window {
    google: any;
  }
}

const Login: React.FC<LoginProps> = ({ onLoginSuccess }) => {
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [regUsername, setRegUsername] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regRole, setRegRole] = useState<UserRole>(UserRole.USER);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [registrationSuccess, setRegistrationSuccess] = useState(false);
  const navigate = useNavigate();
  useEffect(() => {
    setError('');
    setRegistrationSuccess(false);
  }, [activeTab]);

 
  const decodeJWT = (token: string) => {
    try {
      let base64Url = token.split(".")[1];
      let base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
      let jsonPayload = decodeURIComponent(
          atob(base64)
              .split("")
              .map(function (c) {
                  return "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2);
              })
              .join("")
      );
      return JSON.parse(jsonPayload);
    } catch (e) {
      return {};
    }
  };

const handleCredentialResponse = async (response: any) => {
    setIsLoading(true);
    setError('');
    
    console.log("Google Response:", response); 

    try {
      let googleToken = response.credential;
      
      if (!googleToken) {
          throw new Error("Google non ritorna un token.");
      }

      const userData = await login({googleToken: googleToken}, true);
      
      onLoginSuccess({
        role: userData.role,
        name: userData.name
      });
      
      navigate('/');
    } catch (err: any) {
      setError(err.message || 'Errore durante l\'autenticazione con Google.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'login') {
      const intervalId = setInterval(() => {
        if (window.google) {
          clearInterval(intervalId);
          try {
            window.google.accounts.id.initialize({
              client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
              callback: handleCredentialResponse,
              auto_prompt: false
            });

            const btnContainer = document.getElementById("google-btn-login");
            
            if (btnContainer) {
              window.google.accounts.id.renderButton(
                btnContainer,
                { 
                  theme: "outline", 
                  size: "large", 
                  type: "standard", 
                  width: btnContainer.clientWidth,
                  text: "signin_with"
                }
              );
            }
          } catch (e) {
            console.error("Errore durante l'inizializzazione di Google Sign-in", e);
          }
        }
      }, 100);
      return () => clearInterval(intervalId);
    }
  }, [activeTab]);


  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const user = await login({username, password}, false);
      onLoginSuccess(user);
      navigate('/');
    } catch (err: any) {
      setError(err.message); //err.message contiene ciò che gli viene inviato dal service con "throw new Error"
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    if (!regUsername || !regPassword || !regEmail) {
      setError("Tutti i campi sono obbligatori.");
      setIsLoading(false);
      return;
    }

    try {
      // Backend now sends an email, does not return a user object immediately
      await register(regUsername, regPassword, regEmail, regRole);
      setRegistrationSuccess(true);
    } catch (err: any) {
      setError(err.message || 'Errore durante la registrazione.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-64px)] flex items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-md bg-white rounded-[30px] shadow-xl p-8 border border-gray-100">
        
        {!registrationSuccess && (
          <div className="flex bg-gray-200 rounded-full p-1 mb-8 relative">
             <button
               onClick={() => setActiveTab('login')}
               className={`flex-1 py-3 rounded-full text-sm font-bold transition-all duration-300 z-10 
                 ${activeTab === 'login' ? 'bg-[#7dad57] text-white shadow-md' : 'text-gray-600 hover:text-gray-800'}`}
             >
               Accedi
             </button>
             <button
               onClick={() => setActiveTab('register')}
               className={`flex-1 py-3 rounded-full text-sm font-bold transition-all duration-300 z-10
                 ${activeTab === 'register' ? 'bg-[#7dad57] text-white shadow-md' : 'text-gray-600 hover:text-gray-800'}`}
             >
               Registrati
             </button>
          </div>
        )}

        {registrationSuccess ? (
          <div className="flex flex-col items-center text-center animate-in zoom-in duration-300 py-6">
            <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mb-6 shadow-inner">
               <Mail className="w-12 h-12 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Controlla la tua email</h2>
            <p className="text-gray-600 mb-6">
              Abbiamo inviato un link di conferma a <span className="font-bold text-gray-800">{regEmail}</span>.
              <br/>Clicca sul link per attivare il tuo account e accedere.
            </p>
            
            <button 
               onClick={() => {
                 setRegistrationSuccess(false);
                 setActiveTab('login');
                 setRegUsername('');
                 setRegPassword('');
                 setRegEmail('');
               }}
               className="flex items-center gap-2 text-[#7dad57] font-bold hover:underline hover:text-green-700 transition-colors"
            >
               <ArrowLeft className="w-4 h-4" /> Torna al Login
            </button>
          </div>
        ) : (
          <>
            {activeTab === 'login' ? (
              <form onSubmit={handleLogin} className="space-y-5 animate-in fade-in duration-300">
                 
                 {error && (
                   <div className="bg-red-50 text-red-600 text-sm p-3 rounded-xl text-center border border-red-100 flex items-center justify-center gap-2">
                     <span className="font-bold">Errore:</span> {error}
                   </div>
                 )}

                 <div className="space-y-1">
                    <input 
                      type="text" 
                      placeholder="Username" 
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="w-full bg-gray-200 text-gray-800 placeholder-gray-500 px-6 py-4 rounded-full focus:outline-none focus:ring-2 focus:ring-[#7dad57] transition-all"
                    />
                 </div>
                 
                 <div className="space-y-1">
                    <input 
                      type="password" 
                      placeholder="Password" 
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full bg-gray-200 text-gray-800 placeholder-gray-500 px-6 py-4 rounded-full focus:outline-none focus:ring-2 focus:ring-[#7dad57] transition-all"
                    />
                    <div className="px-2">
                      <a href="#" className="text-xs text-[#7dad57] hover:underline pl-2 font-medium">
                        password dimenticata?
                      </a>
                    </div>
                 </div>

                 <div className="pt-2 flex justify-center">
                   <button 
                     type="submit" 
                     disabled={isLoading}
                     className="bg-[#d9e8cd] text-black font-bold text-lg px-12 py-3 rounded-2xl hover:bg-[#c4dbb3] transition-colors shadow-sm disabled:opacity-50"
                   >
                     {isLoading ? '...' : 'Accedi'}
                   </button>
                 </div>

                 <div className="relative py-4">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-gray-300"></div>
                    </div>
                    <div className="relative flex justify-center text-sm">
                      <span className="px-2 bg-white text-gray-400 font-medium">oppure</span>
                    </div>
                 </div>

                  <div className="flex justify-center w-full">
                      <div id="google-btn-login"></div> 
                  </div>

              </form>
            ) : (
              <form onSubmit={handleRegister} className="space-y-4 animate-in fade-in duration-300">
                
                {error && (
                   <div className="bg-red-50 text-red-600 text-sm p-3 rounded-xl text-center border border-red-100 flex items-center justify-center gap-2">
                     <span className="font-bold">Errore:</span> {error}
                   </div>
                 )}

                <input 
                  type="text" 
                  placeholder="Username" 
                  value={regUsername}
                  onChange={(e) => setRegUsername(e.target.value)}
                  className="w-full bg-gray-200 text-gray-800 placeholder-gray-500 px-6 py-4 rounded-full focus:outline-none focus:ring-2 focus:ring-[#7dad57] transition-all"
                  required
                />
                
                <input 
                  type="email" 
                  placeholder="Indirizzo Email" 
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  className="w-full bg-gray-200 text-gray-800 placeholder-gray-500 px-6 py-4 rounded-full focus:outline-none focus:ring-2 focus:ring-[#7dad57] transition-all"
                  required
                />

                <input 
                  type="password" 
                  placeholder="Password" 
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                  className="w-full bg-gray-200 text-gray-800 placeholder-gray-500 px-6 py-4 rounded-full focus:outline-none focus:ring-2 focus:ring-[#7dad57] transition-all"
                  required
                />

                <div className="space-y-2 pt-2">
                   <label className="text-sm font-bold text-gray-600 ml-2">Sono un:</label>
                   <div className="grid grid-cols-3 gap-2">
                     <button
                       type="button"
                       onClick={() => setRegRole(UserRole.USER)}
                       className={`flex flex-col items-center justify-center p-2 rounded-xl border-2 transition-all ${regRole === UserRole.USER ? 'border-[#7dad57] bg-green-50 text-green-700' : 'border-gray-200 text-gray-500 hover:bg-gray-50'}`}
                     >
                       <User className="w-5 h-5 mb-1" />
                       <span className="text-[10px] font-bold">Utente</span>
                     </button>

                     <button
                       type="button"
                       onClick={() => setRegRole(UserRole.OPERATOR)}
                       className={`flex flex-col items-center justify-center p-2 rounded-xl border-2 transition-all ${regRole === UserRole.OPERATOR ? 'border-[#7dad57] bg-green-50 text-green-700' : 'border-gray-200 text-gray-500 hover:bg-gray-50'}`}
                     >
                       <ShieldCheck className="w-5 h-5 mb-1" />
                       <span className="text-[10px] font-bold">Operatore</span>
                     </button>
                   </div>
                </div>

                <div className="pt-4 flex justify-center">
                   <button 
                     type="submit" 
                     disabled={isLoading}
                     className="bg-[#d9e8cd] text-black font-bold text-lg px-12 py-3 rounded-2xl hover:bg-[#c4dbb3] transition-colors shadow-sm disabled:opacity-50"
                   >
                     {isLoading ? '...' : 'Registrati'}
                   </button>
                 </div>
                
              </form>
            )}
          </>
        )}

      </div>
    </div>
  );
};

export default Login;
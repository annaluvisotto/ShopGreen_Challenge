import React, { useState, useEffect } from "react";
import { UserRole, Seller } from "../types";
import { MOCK_ZONES } from "../constants";
import { useLocation } from "react-router-dom";
import {
    User,
    Lock,
    Save,
    AlertCircle,
    CheckCircle,
    Mail,
    ArrowRight,
    RefreshCw,
    ShoppingBag,
    Plus,
    Trash2,
    Link as LinkIcon,
    Edit3,
    Check,
} from "lucide-react";

interface ProfileProps {
    userRole: UserRole;
    currentUserName: string | null;
    onUpdateProfile: (data: { username?: string; password?: string }) => void;
    sellers: Seller[];
    onSaveSellerProfile: (seller: Seller) => void;
}

type ViewState = "PROFILE_EDIT" | "EMAIL_SENT" | "RESET_PASSWORD_FORM";

const Profile: React.FC<ProfileProps> = ({
    userRole,
    currentUserName,
    onUpdateProfile,
    sellers,
    onSaveSellerProfile,
}) => {
    const location = useLocation();
    const [viewState, setViewState] = useState<ViewState>("PROFILE_EDIT");
    const [activeTab, setActiveTab] = useState<"personal" | "seller">(
        "personal"
    );

    // Profile Data
    const [username, setUsername] = useState("");

    // Reset Password Form Data
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");

    // UI Messages
    const [message, setMessage] = useState<{
        type: "success" | "error";
        text: string;
    } | null>(null);

    // Seller Profile Data
    const [sellerZones, setSellerZones] = useState<string[]>([]); // Changed to array
    const [sellerBio, setSellerBio] = useState("");
    const [sellerTags, setSellerTags] = useState(""); // Comma separated string
    const [sellerLinks, setSellerLinks] = useState<
        { name: string; url: string }[]
    >([{ name: "", url: "" }]);
    const [isSellerActive, setIsSellerActive] = useState(false);

    useEffect(() => {
        // Controlla se c'è uno stato passato dalla navigazione
        if (location.state && (location.state as any).initialTab === "seller") {
            setActiveTab("seller");
        }
    }, [location]);

    useEffect(() => {
        if (currentUserName) {
            setUsername(currentUserName);

            // Load existing seller data if any
            const existingSeller = sellers.find(
                (s) => s.username === currentUserName
            );
            if (existingSeller) {
                setIsSellerActive(true);
                setSellerZones(existingSeller.zoneIds);
                setSellerBio(existingSeller.bio || "");
                setSellerTags(existingSeller.categories.join(", "));
                setSellerLinks(
                    existingSeller.platformLinks.length > 0
                        ? existingSeller.platformLinks
                        : [{ name: "", url: "" }]
                );
            }
        }
    }, [currentUserName, sellers]);

    // Handle Username Update
    const handleSaveUsername = (e: React.FormEvent) => {
        e.preventDefault();
        if (!username.trim()) {
            setMessage({
                type: "error",
                text: "Lo username non può essere vuoto.",
            });
            return;
        }
        onUpdateProfile({ username });
        setMessage({
            type: "success",
            text: "Username aggiornato con successo!",
        });
    };

    // Step 1: Request Password Reset (Send Email)
    const handleRequestPasswordReset = () => {
        // Simulation of backend email trigger
        setTimeout(() => {
            setViewState("EMAIL_SENT");
            setMessage(null);
        }, 500);
    };

    // Step 2: Simulate clicking the link in the email
    const handleSimulateEmailLinkClick = () => {
        setViewState("RESET_PASSWORD_FORM");
        setMessage(null);
    };

    // Step 3: Save New Password
    const handleSaveNewPassword = (e: React.FormEvent) => {
        e.preventDefault();
        setMessage(null);

        // Exception 1: Passwords do not match
        if (newPassword !== confirmPassword) {
            setMessage({
                type: "error",
                text: "Le due password non coincidono.",
            });
            return;
        }

        // Exception 2: Invalid password
        if (newPassword.length < 6) {
            setMessage({
                type: "error",
                text: "Password non valida. Inserisci almeno 6 caratteri.",
            });
            return;
        }

        // Success
        onUpdateProfile({ password: newPassword });
        setMessage({
            type: "success",
            text: "Password modificata con successo!",
        });

        // Reset state and go back to main profile after delay
        setNewPassword("");
        setConfirmPassword("");
        setTimeout(() => {
            setViewState("PROFILE_EDIT");
            setMessage(null);
        }, 2000);
    };

    // --- SELLER PROFILE LOGIC ---

    const handleLinkChange = (
        index: number,
        field: "name" | "url",
        value: string
    ) => {
        const newLinks = [...sellerLinks];
        newLinks[index][field] = value;
        setSellerLinks(newLinks);
    };

    const addLinkField = () => {
        setSellerLinks([...sellerLinks, { name: "", url: "" }]);
    };

    const removeLinkField = (index: number) => {
        const newLinks = sellerLinks.filter((_, i) => i !== index);
        setSellerLinks(newLinks);
    };

    const toggleZone = (zoneId: string) => {
        setSellerZones((prev) => {
            if (prev.includes(zoneId)) {
                return prev.filter((id) => id !== zoneId);
            } else {
                return [...prev, zoneId];
            }
        });
    };

    const handleSaveSeller = (e: React.FormEvent) => {
        e.preventDefault();

        if (sellerZones.length === 0) {
            setMessage({
                type: "error",
                text: "Seleziona almeno una zona di scambio.",
            });
            return;
        }

        // Clean data
        const cleanedTags = sellerTags
            .split(",")
            .map((t) => t.trim())
            .filter((t) => t.length > 0);
        const cleanedLinks = sellerLinks.filter(
            (l) => l.name.trim() && l.url.trim()
        );

        if (cleanedTags.length === 0) {
            setMessage({
                type: "error",
                text: "Inserisci almeno una categoria (es. Libri, Vestiti).",
            });
            return;
        }

        const newSellerProfile: Seller = {
            id: isSellerActive
                ? sellers.find((s) => s.username === currentUserName)?.id ||
                  "temp"
                : `s_${Date.now()}`,
            username: currentUserName || "Unknown",
            zoneIds: sellerZones,
            bio: sellerBio,
            categories: cleanedTags,
            platformLinks: cleanedLinks,
            avatarUrl:
                "https://images.unsplash.com/photo-1511367461989-f85a21fda167?auto=format&fit=crop&q=80&w=200", // Default placeholder for now
        };

        onSaveSellerProfile(newSellerProfile);
        setIsSellerActive(true);
        setMessage({
            type: "success",
            text: "Card E-commerce salvata con successo!",
        });
    };

    const renderSellerTab = () => (
        <div className="animate-in fade-in duration-300">
            <div className="bg-green-50 p-4 rounded-xl border border-green-100 mb-6">
                <h3 className="text-green-800 font-bold mb-1 flex items-center gap-2">
                    <ShoppingBag className="w-5 h-5" /> E-commerce
                </h3>
                <p className="text-sm text-green-700">
                    Crea o modifica la scheda visibile agli altri utenti nella
                    sezione E-commerce. Qui puoi elencare cosa vendi e come
                    contattarti.
                </p>
            </div>

            <form onSubmit={handleSaveSeller} className="space-y-6">
                <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-700">
                        Zone di scambio (seleziona multiple)
                    </label>
                    <div className="flex flex-wrap gap-2 mt-1">
                        {MOCK_ZONES.map((z) => {
                            const isSelected = sellerZones.includes(z.id);
                            return (
                                <button
                                    key={z.id}
                                    type="button"
                                    onClick={() => toggleZone(z.id)}
                                    className={`px-4 py-2 rounded-xl text-sm font-bold border-2 transition-all duration-200 flex items-center gap-2
                                ${
                                    isSelected
                                        ? "bg-green-600 text-white border-green-600 shadow-md transform scale-[1.02]"
                                        : "bg-white text-gray-600 border-gray-200 hover:border-green-300"
                                }
                            `}
                                >
                                    {isSelected && (
                                        <Check className="w-3 h-3" />
                                    )}
                                    {z.name}
                                </button>
                            );
                        })}
                    </div>
                    {sellerZones.length === 0 && (
                        <p className="text-xs text-red-500 mt-1">
                            Seleziona almeno una zona
                        </p>
                    )}
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-700">
                        Bio / Informazioni
                    </label>
                    <textarea
                        rows={3}
                        value={sellerBio}
                        onChange={(e) => setSellerBio(e.target.value)}
                        placeholder="Es. Scambio solo a mano, disponibile nel weekend..."
                        className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-green-500 outline-none resize-none"
                    />
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-700">
                        Categorie (separate da virgola)
                    </label>
                    <input
                        type="text"
                        value={sellerTags}
                        onChange={(e) => setSellerTags(e.target.value)}
                        placeholder="Es. Elettronica, Libri Scolastici, Vintage..."
                        className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-green-500 outline-none"
                    />
                    <p className="text-xs text-gray-500">
                        Questi tag aiuteranno gli altri a trovarti nei filtri.
                    </p>
                </div>

                <div className="space-y-3">
                    <label className="text-sm font-semibold text-gray-700 flex justify-between items-center">
                        <span>Link Piattaforme Esterne</span>
                        <button
                            type="button"
                            onClick={addLinkField}
                            className="text-xs text-green-600 font-bold flex items-center gap-1 hover:underline"
                        >
                            <Plus className="w-3 h-3" /> Aggiungi Link
                        </button>
                    </label>

                    {sellerLinks.map((link, index) => (
                        <div key={index} className="flex gap-2 items-start">
                            <div className="flex-1 grid grid-cols-2 gap-2">
                                <input
                                    type="text"
                                    value={link.name}
                                    onChange={(e) =>
                                        handleLinkChange(
                                            index,
                                            "name",
                                            e.target.value
                                        )
                                    }
                                    placeholder="Nome (es. Vinted)"
                                    className="px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:border-green-500"
                                />
                                <input
                                    type="url"
                                    value={link.url}
                                    onChange={(e) =>
                                        handleLinkChange(
                                            index,
                                            "url",
                                            e.target.value
                                        )
                                    }
                                    placeholder="URL Profilo"
                                    className="px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:border-green-500"
                                />
                            </div>
                            {sellerLinks.length > 1 && (
                                <button
                                    type="button"
                                    onClick={() => removeLinkField(index)}
                                    className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            )}
                        </div>
                    ))}
                </div>

                <div className="pt-4">
                    <button
                        type="submit"
                        className="w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-xl font-bold shadow-md transition-transform hover:scale-[1.02] flex items-center justify-center gap-2"
                    >
                        <Save className="w-5 h-5" />
                        {isSellerActive
                            ? "Aggiorna Card"
                            : "Crea Card Venditore"}
                    </button>
                </div>
            </form>
        </div>
    );

    const renderProfileEdit = () => (
        <div className="space-y-8 animate-in fade-in duration-300">
            <form onSubmit={handleSaveUsername} className="space-y-4">
                <h2 className="text-lg font-bold text-gray-800 border-b border-gray-100 pb-2">
                    Dati Personali
                </h2>
                <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                        <User className="w-4 h-4 text-gray-400" /> Username
                    </label>
                    <div className="flex gap-2">
                        <input
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            className="flex-1 px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-green-500 outline-none transition-all"
                            placeholder="Inserisci il tuo username"
                        />
                        <button
                            type="submit"
                            className="bg-green-600 hover:bg-green-700 text-white px-6 rounded-xl font-bold shadow-sm transition-colors"
                        >
                            Salva
                        </button>
                    </div>
                </div>
            </form>

            <div className="space-y-4 pt-2">
                <h2 className="text-lg font-bold text-gray-800 border-b border-gray-100 pb-2">
                    Sicurezza
                </h2>
                <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                        <Lock className="w-4 h-4 text-gray-400" /> Password
                    </label>
                    <div
                        onClick={handleRequestPasswordReset}
                        className="group cursor-pointer relative"
                    >
                        <input
                            type="password"
                            value="fakepassword123"
                            readOnly
                            className="w-full px-4 py-3 rounded-xl border border-gray-300 bg-gray-50 text-gray-400 cursor-pointer group-hover:border-green-400 transition-all focus:outline-none"
                        />
                        <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                            <span className="text-sm font-semibold text-green-600 group-hover:underline flex items-center gap-1">
                                Modifica <ArrowRight className="w-4 h-4" />
                            </span>
                        </div>
                    </div>
                    <p className="text-xs text-gray-500 italic">
                        Clicca sul campo password per richiedere la modifica. Ti
                        invieremo una email.
                    </p>
                </div>
            </div>
        </div>
    );

    const renderEmailSent = () => (
        <div className="text-center py-10 space-y-6 animate-in zoom-in duration-300">
            <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mx-auto">
                <Mail className="w-10 h-10 text-blue-500" />
            </div>
            <div>
                <h2 className="text-2xl font-bold text-gray-900">
                    Controlla la tua posta
                </h2>
                <p className="text-gray-600 mt-2 max-w-md mx-auto">
                    Abbiamo inviato una email all'indirizzo associato al tuo
                    account. Clicca sul link all'interno per reimpostare la
                    password.
                </p>
            </div>
            <div className="pt-6 border-t border-gray-100 mt-6">
                <p className="text-xs text-gray-400 font-mono mb-2">
                    [SIMULAZIONE SVILUPPO]
                </p>
                <button
                    onClick={handleSimulateEmailLinkClick}
                    className="bg-gray-800 hover:bg-gray-900 text-white px-6 py-3 rounded-lg text-sm font-bold shadow-lg transition-transform hover:scale-105"
                >
                    Simula Click Link Email
                </button>
            </div>
            <button
                onClick={() => setViewState("PROFILE_EDIT")}
                className="text-sm text-gray-500 underline mt-4"
            >
                Torna indietro
            </button>
        </div>
    );

    const renderResetForm = () => (
        <div className="space-y-6 animate-in slide-in-from-right duration-300">
            <div className="flex items-center gap-2 mb-4 text-green-700 bg-green-50 p-3 rounded-lg border border-green-100">
                <RefreshCw className="w-5 h-5" />
                <span className="font-semibold text-sm">
                    Reimpostazione Password in corso...
                </span>
            </div>

            <form onSubmit={handleSaveNewPassword} className="space-y-5">
                <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-700">
                        Nuova Password
                    </label>
                    <input
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-green-500 outline-none"
                        placeholder="Minimo 6 caratteri"
                    />
                </div>
                <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-700">
                        Reinserisci Password
                    </label>
                    <input
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-green-500 outline-none"
                        placeholder="Conferma la password"
                    />
                </div>

                <div className="flex gap-3 pt-4">
                    <button
                        type="button"
                        onClick={() => setViewState("PROFILE_EDIT")}
                        className="flex-1 py-3 text-gray-600 font-semibold hover:bg-gray-50 rounded-xl transition-colors"
                    >
                        Annulla
                    </button>
                    <button
                        type="submit"
                        className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-xl shadow-md transition-all"
                    >
                        Salva Password
                    </button>
                </div>
            </form>
        </div>
    );

    return (
        <div className="max-w-3xl mx-auto p-4 md:p-8">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                {/* Header */}
                <div className="bg-green-50 p-6 border-b border-green-100 flex items-center gap-4">
                    <div className="w-16 h-16 bg-green-600 rounded-full flex items-center justify-center text-white shadow-md">
                        <User className="w-8 h-8" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">
                            {viewState === "RESET_PASSWORD_FORM"
                                ? "Reimposta Password"
                                : "Il tuo Account"}
                        </h1>
                        <p className="text-green-700 font-medium flex items-center gap-2">
                            {userRole === UserRole.OPERATOR
                                ? "Operatore Autorizzato"
                                : "Utente Standard"}
                            {isSellerActive && (
                                <span className="bg-green-600 text-white text-[10px] px-2 py-0.5 rounded-full uppercase">
                                    Venditore Attivo
                                </span>
                            )}
                        </p>
                    </div>
                </div>

                {/* Tab Switcher */}
                {viewState === "PROFILE_EDIT" && (
                    <div className="flex border-b border-gray-100">
                        <button
                            onClick={() => setActiveTab("personal")}
                            className={`flex-1 py-4 text-center font-bold text-sm transition-colors relative ${
                                activeTab === "personal"
                                    ? "text-green-700 bg-green-50/50"
                                    : "text-gray-500 hover:bg-gray-50"
                            }`}
                        >
                            Dati Personali
                            {activeTab === "personal" && (
                                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-green-600"></div>
                            )}
                        </button>
                        <button
                            onClick={() => setActiveTab("seller")}
                            className={`flex-1 py-4 text-center font-bold text-sm transition-colors relative ${
                                activeTab === "seller"
                                    ? "text-green-700 bg-green-50/50"
                                    : "text-gray-500 hover:bg-gray-50"
                            }`}
                        >
                            E-commerce
                            {activeTab === "seller" && (
                                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-green-600"></div>
                            )}
                        </button>
                    </div>
                )}

                {/* Content */}
                <div className="p-6 md:p-8">
                    {message && (
                        <div
                            className={`mb-6 p-4 rounded-xl flex items-center gap-3 ${
                                message.type === "success"
                                    ? "bg-green-50 text-green-700 border border-green-200"
                                    : "bg-red-50 text-red-700 border border-red-200"
                            }`}
                        >
                            {message.type === "success" ? (
                                <CheckCircle className="w-5 h-5" />
                            ) : (
                                <AlertCircle className="w-5 h-5" />
                            )}
                            <span className="font-medium">{message.text}</span>
                        </div>
                    )}

                    {viewState === "PROFILE_EDIT" &&
                        (activeTab === "personal"
                            ? renderProfileEdit()
                            : renderSellerTab())}
                    {viewState === "EMAIL_SENT" && renderEmailSent()}
                    {viewState === "RESET_PASSWORD_FORM" && renderResetForm()}
                </div>
            </div>
        </div>
    );
};

export default Profile;


import { Shop, ShopCategory, ShopStatus, Zone, Seller, Notification, NotificationType } from './types';

// Center of Trento
export const TRENTO_CENTER = { lat: 46.06787, lng: 11.12108 };

export const MOCK_SHOPS: Shop[] = [
  {
    id: '1',
    name: 'EcoWear Trento',
    category: ShopCategory.CLOTHING,
    status: ShopStatus.OPEN,
    coordinates: { lat: 46.069, lng: 11.122 },
    address: 'Via San Pietro, 12, Trento',
    description: 'Abbigliamento sostenibile e cotone organico.',
    hours: `lun 9-17
mar 9-17
mer 9-12.30
gio 9-17
ven 9-17
sab 9-12.30
dom chiuso`,
    imageUrl: 'https://images.unsplash.com/photo-1551232864-3f0890e580d9?auto=format&fit=crop&q=80&w=600',
    website: 'https://ecowear.example.com',
    sustainabilityScore: 10,
    votes: {},
    reviews: [
      { id: 'r1', user: 'Maria', comment: 'Ottima qualità!', date: '2023-10-15' }
    ]
  },
  {
    id: '2',
    name: 'BioMarket',
    category: ShopCategory.FOOD,
    status: ShopStatus.OPENING_SOON,
    coordinates: { lat: 46.066, lng: 11.120 },
    address: 'Piazza Duomo, 5, Trento',
    description: 'Alimenti biologici a km 0. Apertura prevista a breve.',
    hours: 'Chiuso',
    imageUrl: 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=600',
    sustainabilityScore: 0,
    votes: {},
    reviews: []
  },
  {
    id: '3',
    name: 'Saponi Naturali',
    category: ShopCategory.HOME_CARE,
    status: ShopStatus.CLOSED,
    coordinates: { lat: 46.071, lng: 11.118 },
    address: 'Via Manci, 22, Trento',
    description: 'Saponi fatti a mano senza plastica.',
    hours: 'Chiuso definitivamente',
    imageUrl: 'https://images.unsplash.com/photo-1600857062241-98e5dba7f214?auto=format&fit=crop&q=80&w=600',
    sustainabilityScore: 5,
    votes: {},
    reviews: []
  },
  {
    id: '4',
    name: 'Mercatino dell\'Usato',
    category: ShopCategory.ALL,
    status: ShopStatus.UNVERIFIED,
    coordinates: { lat: 46.065, lng: 11.125 },
    address: 'Via S. Croce, Trento',
    description: 'Bancarella segnalata da utente. In attesa di verifica.',
    hours: `lun-ven 10-18
sab 9-13
dom chiuso`,
    // Removed Image URL to test the layout without image
    imageUrl: '', 
    sustainabilityScore: 3, 
    votes: { 'testuser': 'up' }, 
    reviews: []
  },
  {
    id: '5',
    name: 'VerdeCasa',
    category: ShopCategory.HOME_CARE,
    status: ShopStatus.OPEN,
    coordinates: { lat: 46.063, lng: 11.121 },
    address: 'Corso 3 Novembre, Trento',
    description: 'Prodotti per la casa ricaricabili.',
    hours: `lun 8.30-19.30
mar 8.30-19.30
mer 8.30-19.30
gio 8.30-19.30
ven 8.30-19.30
sab 9-19`,
    imageUrl: 'https://images.unsplash.com/photo-1556910103-1c02745a30bf?auto=format&fit=crop&q=80&w=600',
    sustainabilityScore: 20,
    votes: {},
    reviews: []
  }
];

export const MOCK_ZONES: Zone[] = [
  { id: 'z1', name: 'Centro Storico', center: { lat: 46.067, lng: 11.121 } },
  { id: 'z2', name: 'Povo', center: { lat: 46.066, lng: 11.150 } },
  { id: 'z3', name: 'Trento Nord', center: { lat: 46.085, lng: 11.115 } },
];

export const MOCK_NOTIFICATIONS: Notification[] = [
  // SYSTEM (All)
  {
    id: 'n1',
    type: NotificationType.SYSTEM,
    title: 'Benvenuto su ShopGreen!',
    previewText: 'Scopri come utilizzare al meglio la piattaforma.',
    fullDescription: 'Benvenuto in ShopGreen Trento! La nostra missione è promuovere la sostenibilità locale. Utilizza la mappa per trovare negozi, o la sezione E-Commerce per scambiare oggetti con i vicini.',
    date: '2023-10-20',
    read: false
  },
  // PROMO (User)
  {
    id: 'n2',
    type: NotificationType.PROMO,
    title: 'Sconto 20% EcoWear',
    previewText: 'Solo per oggi, mostra questo messaggio in cassa.',
    fullDescription: 'Flash Sale! Presso EcoWear Trento, ricevi il 20% di sconto su tutta la collezione in cotone organico. Offerta valida fino a chiusura negozio.',
    imageUrl: 'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?auto=format&fit=crop&q=80&w=600',
    date: 'Oggi',
    read: false
  },
  // REPORT (Operator)
  {
    id: 'n3',
    type: NotificationType.REPORT,
    title: 'Nuova Attività: "Orto Urbano"',
    previewText: 'Richiesta verifica licenza e approvazione.',
    fullDescription: 'L\'utente "EcoGiulia" ha segnalato una nuova attività. È necessario verificare la corrispondenza della licenza commerciale n. TN-2023-9988 con la Banca Dati comunale.',
    shopName: 'Orto Urbano',
    shopId: 'temp_99',
    licenseId: 'TN-2023-9988',
    reporterId: 'EcoGiulia', // Changed to match an existing user for testing
    date: 'Ieri',
    read: false
  }
];
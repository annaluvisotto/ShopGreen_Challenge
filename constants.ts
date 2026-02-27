
import { Zone, NotificationType, Notification } from './types';

export const TRENTO_CENTER = { lat: 46.06787, lng: 11.12108 };

export const MOCK_ZONES: Zone[] = [
  { id: 'Meano', name: 'Meano', center: TRENTO_CENTER },
  { id: 'Gardolo', name: 'Gardolo', center: TRENTO_CENTER },
  { id: 'Argentario', name: 'Argentario', center: TRENTO_CENTER },
  { id: 'Centro Storico Piedicastello', name: 'Centro Storico Piedicastello', center: TRENTO_CENTER },
  { id: 'Bondone', name: 'Bondone', center: TRENTO_CENTER },
  { id: 'San Giuseppe Santa Chiara', name: 'San Giuseppe Santa Chiara', center: TRENTO_CENTER },
  { id: 'Sardagna', name: 'Sardagna', center: TRENTO_CENTER },
  { id: 'Povo', name: 'Povo', center: TRENTO_CENTER },
  { id: 'Oltrefersina', name: 'Oltrefersina', center: TRENTO_CENTER },
  { id: 'Ravina-Romagnano', name: 'Ravina-Romagnano', center: TRENTO_CENTER },
  { id: 'Villazzano', name: 'Villazzano', center: TRENTO_CENTER },
  { id: 'Mattarello', name: 'Mattarello', center: TRENTO_CENTER }
];

export const DB_CATEGORIES = [
  "cura della casa e della persona",
  "alimenti",
  "vestiario"
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
    title: 'Sconto 20% Altr\'Uso',
    previewText: 'Sconto del 20% su tutti gli articoli invernali',
    fullDescription: 'Sconti invernali! Presso ALtr\'Uso Trento, ricevi il 20% di sconto su tutta la collezione invernale.',
    imageUrl: 'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?auto=format&fit=crop&q=80&w=600',
    date: 'Oggi',
    read: false
  }
  ];
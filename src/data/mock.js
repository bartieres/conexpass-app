export const CATEGORIES = [
  { id: 'todos', label: 'Todos', icon: 'grid-outline' },
  { id: 'academia', label: 'Academia', icon: 'barbell-outline' },
  { id: 'crossfit', label: 'CrossFit', icon: 'flash-outline' },
  { id: 'natacao', label: 'Natação', icon: 'water-outline' },
  { id: 'lutas', label: 'Lutas', icon: 'shield-outline' },
];

export const GYMS = [
  {
    id: '1',
    name: 'Academia Performance',
    category: 'Academia',
    distance: '350 m',
    hours: 'Aberto até 22:00',
    rating: 4.8,
    reviews: 120,
    address: 'Rua das Acácias, 123 — Jardim Botânico, Londrina - PR',
    about:
      'Estrutura completa com equipamentos modernos e profissionais qualificados para te ajudar a alcançar seus objetivos.',
    amenities: ['Wi-Fi', 'Vestiário', 'Estacionamento', 'Ar-cond.'],
    image: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=900&q=80',
    coord: { top: '46%', left: '46%' },
  },
  {
    id: '2',
    name: 'Studio Fit Training',
    category: 'Academia',
    distance: '650 m',
    hours: 'Aberto até 21:00',
    rating: 4.6,
    reviews: 85,
    address: 'Av. Higienópolis, 540 — Centro, Londrina - PR',
    about: 'Studio boutique com treinos funcionais em grupos pequenos e atendimento personalizado.',
    amenities: ['Wi-Fi', 'Vestiário', 'Ar-cond.'],
    image: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=900&q=80',
    coord: { top: '30%', left: '70%' },
  },
  {
    id: '3',
    name: 'Natação Ativa',
    category: 'Natação',
    distance: '1,2 km',
    hours: 'Aberto até 20:00',
    rating: 4.9,
    reviews: 60,
    address: 'Rua Piauí, 210 — Vila Ipiranga, Londrina - PR',
    about: 'Piscinas semiolímpicas aquecidas e aulas com professores especializados.',
    amenities: ['Vestiário', 'Estacionamento'],
    image: 'https://images.unsplash.com/photo-1600965962361-9035dbfd1c50?w=900&q=80',
    coord: { top: '62%', left: '30%' },
  },
];

export const HISTORY = [
  { id: 'h1', name: 'Academia Performance', date: 'Hoje, 08:45', location: 'Londrina - PR', status: 'success' },
  { id: 'h2', name: 'Studio Fit Training', date: '18/05/2025, 19:10', location: 'Londrina - PR', status: 'success' },
  { id: 'h3', name: 'Academia Performance', date: '16/05/2025, 07:30', location: 'Londrina - PR', status: 'success' },
  { id: 'h4', name: 'Natação Ativa', date: '14/05/2025, 18:20', location: 'Londrina - PR', status: 'success' },
  { id: 'h5', name: 'CrossFit Londrina', date: '12/05/2025, 06:45', location: 'Londrina - PR', status: 'success' },
  { id: 'h6', name: 'Academia Performance', date: 'Hoje, 08:45', location: 'Londrina - PR', status: 'success' },
  { id: 'h7', name: 'Studio Fit Training', date: '18/05/2025, 19:10', location: 'Londrina - PR', status: 'success' },
  { id: 'h8', name: 'Academia Performance', date: '16/05/2025, 07:30', location: 'Londrina - PR', status: 'success' },
  { id: 'h9', name: 'Natação Ativa', date: '14/05/2025, 18:20', location: 'Londrina - PR', status: 'success' },
  { id: 'h10', name: 'CrossFit Londrina', date: '12/05/2025, 06:45', location: 'Londrina - PR', status: 'success' },
];

export const USER = {
  name: 'Lucas Oliveira',
  email: 'lucas.oliveira@email.com',
  plan: 'Premium',
  avatar: 'https://images.unsplash.com/photo-1633332755192-727a05c4013d?w=300&q=80',
};

export const PLANS = [
  {
    id: 'basico',
    name: 'Básico',
    price: 'R$ 29,90',
    period: '/mês',
    features: ['3 check-ins por dia', 'Acesso a academias básicas', 'Suporte padrão'],
    popular: false,
  },
  {
    id: 'premium',
    name: 'Premium',
    price: 'R$ 49,90',
    period: '/mês',
    features: ['5 check-ins por dia', 'Acesso a todas academias', 'Benefícios exclusivos', 'Suporte prioritário'],
    popular: true,
  },
];

import { Stethoscope, HeartPulse, HandHeart, SprayCan } from 'lucide-react';

// Codes valables pour le planning MÉDICAL (fournis par l'équipe).
// Les autres catégories n'ont pas encore de codes définis : configurable plus tard.
const CODES_MEDICAL = [
  { code: 'K1', label: 'Zone Centre K1', detail: '7h – 13h', color: '#0E7490', bg: '#EBF6F8', heures: 6 },
  { code: 'K2', label: 'Zone Centre K2', detail: '14h – 17h', color: '#0E7490', bg: '#EBF6F8', heures: 3 },
  { code: 'K3', label: 'Zone Centre K3', detail: '13h – 19h', color: '#0E7490', bg: '#EBF6F8', heures: 6 },
  { code: 'MAO', label: "Médecin d'accueil / tri", detail: '7h – 13h', color: '#B45309', bg: '#FEF3E2', heures: 6 },
  { code: 'KRO', label: 'Consultation chronique', detail: '7h – 13h', color: '#B45309', bg: '#FEF3E2', heures: 6 },
  { code: 'S', label: 'Consultation à Sada', detail: '7h – 13h', color: '#B45309', bg: '#FEF3E2', heures: 6 },
  { code: 'G', label: 'Garde', detail: '19h – 7h', color: '#C2410C', bg: '#FDF1EC', heures: 12 },
  { code: 'RS', label: 'Repos de garde', detail: '', color: '#65521E', bg: '#F8F2E6', heures: 0 },
  { code: 'CA', label: 'Congés', detail: '', color: '#15803D', bg: '#ECFDF3', heures: 0 },
  { code: 'CF', label: 'Congés', detail: '', color: '#15803D', bg: '#ECFDF3', heures: 0 },
  { code: 'ADM', label: 'Administratif (chef de service)', detail: '', color: '#5B21B6', bg: '#F2EBFB', heures: 0 },
  { code: 'DEB', label: 'Début de contrat', detail: '', color: '#1A2B3D', bg: '#EEF1F4', heures: 0 },
  { code: 'FIN', label: 'Fin de contrat', detail: '', color: '#1A2B3D', bg: '#EEF1F4', heures: 0 },
  { code: 'X', label: 'Avant / après contrat', detail: '', color: '#9CA3AF', bg: '#F3F4F6', heures: 0 },
];

export const PLANNING_CATEGORIES = [
  {
    id: 'medical',
    label: 'Médical',
    sublabel: 'Médecins',
    icon: Stethoscope,
    color: '#0F766E',
    bg: '#ECFAF8',
    codes: CODES_MEDICAL,
    configured: true,
  },
  {
    id: 'infirmiers',
    label: 'Infirmiers',
    sublabel: 'IDE',
    icon: HeartPulse,
    color: '#0E7490',
    bg: '#EBF6F8',
    codes: [],
    configured: false,
  },
  {
    id: 'aide-soignants',
    label: 'Aide-soignants',
    sublabel: 'AS',
    icon: HandHeart,
    color: '#B45309',
    bg: '#FEF3E2',
    codes: [],
    configured: false,
  },
  {
    id: 'ash',
    label: 'ASH',
    sublabel: 'Agents de service',
    icon: SprayCan,
    color: '#65521E',
    bg: '#F8F2E6',
    codes: [],
    configured: false,
  },
];

export function getPlanningCategory(id) {
  return PLANNING_CATEGORIES.find(c => c.id === id);
}

export function codeInfo(categoryId, code) {
  const cat = getPlanningCategory(categoryId);
  return cat?.codes.find(c => c.code === code);
}

// Postes à pourvoir chaque jour pour la catégorie Médical.
// `slots` = nombre de médecins nécessaires sur ce poste ce jour-là.
// `heures` surcharge la durée du code générique pour CE poste précis (utile pour les
// créneaux week-end où G ne dure que 6h au lieu des 12h habituels de la garde de nuit).
export const POSTES_MEDICAL_SEMAINE = [
  { code: 'K1', moment: 'M', slots: 3, optionnel: false },
  { code: 'MAO', moment: 'M', slots: 1, optionnel: false },
  { code: 'KRO', moment: 'M', slots: 1, optionnel: false },
  { code: 'S', moment: 'M', slots: 1, optionnel: true },
  { code: 'K2', moment: 'AM', slots: 1, optionnel: false },
  { code: 'K3', moment: 'AM', slots: 1, optionnel: false },
  { code: 'G', moment: 'N', slots: 1, optionnel: false },
];

// Samedi : matin en K1 normal (3 postes, dont 1 bascule sur les urgences selon l'affluence),
// puis la garde prend le relais dès l'après-midi.
export const POSTES_MEDICAL_SAMEDI = [
  { code: 'K1', moment: 'M', slots: 3, optionnel: false },
  { code: 'G', moment: 'AM', slots: 1, optionnel: false, heures: 6 },
  { code: 'G', moment: 'N', slots: 1, optionnel: false, heures: 12 },
];

// Dimanche : garde continue sur les 3 créneaux, potentiellement 3 médecins différents.
export const POSTES_MEDICAL_DIMANCHE = [
  { code: 'G', moment: 'M', slots: 1, optionnel: false, heures: 6 },
  { code: 'G', moment: 'AM', slots: 1, optionnel: false, heures: 6 },
  { code: 'G', moment: 'N', slots: 1, optionnel: false, heures: 12 },
];

export function isWeekday(date) {
  const d = date.getDay();
  return d >= 1 && d <= 5;
}

export function getPostesForDay(categoryId, date) {
  if (categoryId !== 'medical') return [];
  const d = date.getDay(); // 0=dimanche, 6=samedi
  if (d === 6) return POSTES_MEDICAL_SAMEDI;
  if (d === 0) return POSTES_MEDICAL_DIMANCHE;
  return POSTES_MEDICAL_SEMAINE;
}

export const MOMENTS = [
  { id: 'M', label: 'Matin' },
  { id: 'AM', label: 'Après-midi' },
  { id: 'N', label: 'Nuit' },
];

export const JOURS_FR = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
export const MOIS_FR = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];

export function getDaysInMonth(year, month) {
  const days = [];
  const date = new Date(year, month, 1);
  while (date.getMonth() === month) {
    days.push(new Date(date));
    date.setDate(date.getDate() + 1);
  }
  return days;
}

export function dateKey(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

// Découpe le mois en semaines Lundi -> Dimanche.
// Les jours hors mois (début/fin de semaine à cheval) sont inclus avec un flag outOfMonth,
// pour garder des semaines complètes de 7 jours mais distinguer visuellement le hors-mois.
export function getWeeksMonday(year, month) {
  const first = new Date(year, month, 1);
  const last = new Date(year, month + 1, 0);

  // Lundi de la semaine contenant le 1er du mois (getDay: 0=dim..6=sam)
  const firstWeekday = (first.getDay() + 6) % 7; // 0=lundi..6=dimanche
  const start = new Date(first);
  start.setDate(start.getDate() - firstWeekday);

  // Dimanche de la semaine contenant le dernier jour du mois
  const lastWeekday = (last.getDay() + 6) % 7;
  const end = new Date(last);
  end.setDate(end.getDate() + (6 - lastWeekday));

  const weeks = [];
  let cursor = new Date(start);
  while (cursor <= end) {
    const week = [];
    for (let i = 0; i < 7; i++) {
      week.push({ date: new Date(cursor), outOfMonth: cursor.getMonth() !== month });
      cursor.setDate(cursor.getDate() + 1);
    }
    weeks.push(week);
  }
  return weeks;
}

// Calcule, pour un agent sur un mois donné : heures totales, nombre de gardes (G),
// nombre de RS posés. Utilise en priorité les heures du POSTE du jour (qui peuvent
// différer du code générique, ex: G = 6h le week-end vs 12h en semaine), avec repli
// sur les heures génériques du code si aucun poste structuré ne correspond.
export function computeAgentStats(category, agentId, cellules, year, month) {
  const days = getDaysInMonth(year, month);
  let heures = 0, gardes = 0, rs = 0;
  days.forEach(d => {
    const dk = dateKey(d);
    const postesJour = getPostesForDay(category.id, d);
    ['M', 'AM', 'N'].forEach(moment => {
      const code = cellules[`${agentId}|${dk}|${moment}`];
      if (!code) return;
      const poste = postesJour.find(p => p.code === code && p.moment === moment);
      const info = category.codes.find(c => c.code === code);
      const h = poste?.heures ?? info?.heures ?? 0;
      heures += h;
      if (code === 'G') gardes += 1;
      if (code === 'RS') rs += 1;
    });
  });
  return { heures, gardes, rs };
}

function addDays(d, n) {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
}

// Un agent est considéré "présent" à une date s'il est dans la fenêtre [arrivee, depart]
// (bornes incluses). Une date manquante = pas de limite de ce côté-là.
export function isAgentPresent(agent, dk) {
  if (agent.arrivee && dk < agent.arrivee) return false;
  if (agent.depart && dk > agent.depart) return false;
  return true;
}

// Détermine si un agent est disponible pour un poste donné, un jour donné, en appliquant
// les règles : présence (arrivée/départ), pas en congés ce jour, pas de garde la veille au soir,
// pas déjà affecté à un autre poste ce même jour.
export function getAgentAvailability(category, agent, date, cellules) {
  const dk = dateKey(date);
  const veille = dateKey(addDays(date, -1));

  if (!isAgentPresent(agent, dk)) {
    return { available: false, reason: 'Pas encore arrivé ou déjà parti' };
  }

  const codesJour = ['M', 'AM', 'N']
    .map(m => ({ moment: m, code: cellules[`${agent.id}|${dk}|${m}`] }))
    .filter(c => c.code);

  const enConges = codesJour.some(c => c.code === 'CA' || c.code === 'CF');
  if (enConges) {
    return { available: false, reason: 'En congés ce jour' };
  }

  const codeVeilleNuit = cellules[`${agent.id}|${veille}|N`];
  if (codeVeilleNuit === 'G') {
    return { available: false, reason: 'Garde la veille au soir' };
  }

  if (codesJour.length > 0) {
    return { available: false, reason: `Déjà affecté (${codesJour[0].code})`, alreadyAssigned: codesJour[0].code };
  }

  return { available: true, reason: null };
}

// Liste les agents disponibles pour un poste/jour donné, avec leur statut.
// Renvoie deux groupes pour faciliter l'affichage : disponibles puis indisponibles (avec motif).
export function getAgentsForPoste(category, agents, date, cellules) {
  const withAvailability = agents.map(agent => ({
    agent,
    ...getAgentAvailability(category, agent, date, cellules),
  }));
  return {
    disponibles: withAvailability.filter(a => a.available),
    indisponibles: withAvailability.filter(a => !a.available),
  };
}

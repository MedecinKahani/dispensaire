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
    sublabel: "Agents de service hospitalier",
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
// nombre de RS posés. Repose sur le champ `heures` de chaque code de la catégorie.
export function computeAgentStats(category, agentId, cellules, year, month) {
  const days = getDaysInMonth(year, month);
  let heures = 0, gardes = 0, rs = 0;
  days.forEach(d => {
    const dk = dateKey(d);
    ['M', 'AM', 'N'].forEach(moment => {
      const code = cellules[`${agentId}|${dk}|${moment}`];
      if (!code) return;
      const info = category.codes.find(c => c.code === code);
      if (info) heures += info.heures || 0;
      if (code === 'G') gardes += 1;
      if (code === 'RS') rs += 1;
    });
  });
  return { heures, gardes, rs };
}

import { Stethoscope } from 'lucide-react';

// Codes valables pour le planning MÉDICAL (fournis par l'équipe).
// Les autres catégories n'ont pas encore de codes définis : configurable plus tard.
const CODES_MEDICAL = [
  { code: 'K1', label: 'Zone Centre K1', detail: '7h – 13h', color: '#1D4ED8', bg: '#EFF6FF', heures: 6 },
  { code: 'K2', label: 'Zone Centre K2', detail: '14h – 17h', color: '#1D4ED8', bg: '#EFF6FF', heures: 3 },
  { code: 'K3', label: 'Zone Centre K3', detail: '13h – 19h', color: '#1D4ED8', bg: '#EFF6FF', heures: 6 },
  { code: 'MAO', label: "Médecin d'accueil / tri", detail: '7h – 13h', color: '#1D4ED8', bg: '#EFF6FF', heures: 6 },
  { code: 'KRO', label: 'Consultation chronique', detail: '7h – 13h', color: '#1D4ED8', bg: '#EFF6FF', heures: 6 },
  { code: 'S', label: 'Consultation à Sada', detail: '7h – 13h', color: '#1D4ED8', bg: '#EFF6FF', heures: 6 },
  { code: 'ADM', label: 'Administratif (chef de service)', detail: '', color: '#1D4ED8', bg: '#EFF6FF', heures: 0 },
  { code: 'G', label: 'Garde', detail: '19h – 7h', color: '#C2410C', bg: '#FDF1EC', heures: 12 },
  { code: 'RS', label: 'Repos de garde', detail: '', color: '#9CA3AF', bg: '#F3F4F6', heures: 0 },
  { code: 'RG', label: 'Récupération garde', detail: '', color: '#92400E', bg: '#FEF08A', heures: 0 },
  { code: 'CA', label: 'Congés annuels', detail: '', color: '#15803D', bg: '#ECFDF3', heures: 0 },
  { code: 'CF', label: 'Congés formation', detail: '', color: '#15803D', bg: '#ECFDF3', heures: 0 },
  { code: 'DEB', label: 'Début de contrat', detail: '', color: '#6B7280', bg: '#F3F4F6', heures: 0 },
  { code: 'FIN', label: 'Fin de contrat', detail: '', color: '#6B7280', bg: '#F3F4F6', heures: 0 },
  { code: 'X', label: 'Avant / après contrat', detail: '', color: '#9CA3AF', bg: '#F3F4F6', heures: 0 },
];

export const PLANNING_CATEGORIES = [
  {
    id: 'medical',
    label: 'Médecins Kahani',
    sublabel: 'Médecins',
    icon: Stethoscope,
    color: '#0F766E',
    bg: '#ECFAF8',
    codes: CODES_MEDICAL,
    configured: true,
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

// Un code "annulé" est stocké avec un préfixe '~' (ex. '~K1') plutôt que d'être effacé.
// Permet de garder une trace visuelle (transparente) du créneau initialement prévu,
// distincte d'une case jamais remplie — utile en cas d'absence imprévue le jour J.
export function isCancelledCode(rawCode) {
  return typeof rawCode === 'string' && rawCode.startsWith('~');
}
export function cancelledCodeValue(rawCode) {
  return isCancelledCode(rawCode) ? rawCode.slice(1) : rawCode;
}
export function makeCancelledCode(code) {
  return `~${code}`;
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

// Calcule, pour un agent sur un mois donné : heures totales, heures moyennes par semaine
// (base 4,33 semaines/mois), nombre de gardes de nuit (G sur le créneau N) et de gardes
// de jour (G sur M ou AM — cas du week-end : samedi après-midi, dimanche matin/après-midi).
// Utilise en priorité les heures du POSTE du jour (qui peuvent différer du code générique,
// ex: G = 6h le week-end vs 12h en semaine), avec repli sur les heures génériques du code.
export function computeAgentStats(category, agentId, cellules, year, month) {
  const days = getDaysInMonth(year, month);
  let heures = 0, gardesNuit = 0, gardesJour = 0, rs = 0;
  days.forEach(d => {
    const dk = dateKey(d);
    const postesJour = getPostesForDay(category.id, d);
    ['M', 'AM', 'N'].forEach(moment => {
      const rawCode = cellules[`${agentId}|${dk}|${moment}`];
      if (!rawCode || isCancelledCode(rawCode)) return; // un créneau annulé ne compte pas
      const code = rawCode;
      const poste = postesJour.find(p => p.code === code && p.moment === moment);
      const info = category.codes.find(c => c.code === code);
      const h = poste?.heures ?? info?.heures ?? 0;
      heures += h;
      if (code === 'G') {
        if (moment === 'N') gardesNuit += 1;
        else gardesJour += 1;
      }
      if (code === 'RS') rs += 1;
    });
  });
  const heuresParSemaine = heures / 4.33;
  return { heures, heuresParSemaine, gardesNuit, gardesJour, rs };
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

// Indique si une date donnée, pour un agent, est le lendemain d'une garde de nuit (G la veille au soir).
// Se déclenche automatiquement dès la présence de la garde la veille, que le jour J soit vide
// ou déjà marqué RS — sert à griser visuellement ce jour comme "repos de garde mérité"
// plutôt que de le laisser apparaître comme un jour off ordinaire.
export function isPostGardeRS(agentId, date, cellules) {
  const veille = dateKey(addDays(date, -1));
  return cellules[`${agentId}|${veille}|N`] === 'G';
}

// Détermine si un agent est disponible pour un poste donné, un jour donné, en appliquant
// les règles : présence (arrivée/départ), pas en congés ce jour, pas de garde la veille au soir.
// Un agent peut être affecté à plusieurs créneaux le même jour (ex. matin + après-midi),
// la seule contrainte forte étant l'impossibilité de travailler le lendemain d'une garde de nuit.
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

// Formatage et tri des noms d'agents.
// Nouveau modèle : { nomFamille, prenom }. Ancien modèle (rétrocompat) : { nom } en une seule chaîne,
// affiché tel quel sans pouvoir le re-séparer de façon fiable (ex: "DE SAINT JORES Theo").

// Affiche "NOM Prénom" (nom de famille en majuscules, prénom en casse normale).
export function formatAgentName(agent) {
  if (agent.nomFamille) {
    const famille = agent.nomFamille.trim().toUpperCase();
    const prenom = (agent.prenom || '').trim();
    return prenom ? `${famille} ${prenom}` : famille;
  }
  // Ancien format : on affiche tel quel, on ne devine pas la coupure nom/prénom.
  return agent.nom || '';
}

// Clé de tri alphabétique par nom de famille (puis prénom en cas d'égalité).
export function agentSortKey(agent) {
  if (agent.nomFamille) {
    return `${agent.nomFamille.trim().toUpperCase()}|${(agent.prenom || '').trim().toLowerCase()}`;
  }
  return (agent.nom || '').trim().toUpperCase();
}

// Renvoie une copie triée par ordre alphabétique de nom de famille.
export function sortAgents(agents) {
  return [...agents].sort((a, b) => agentSortKey(a).localeCompare(agentSortKey(b), 'fr'));
}

// ----- Jours fériés français (fixes + mobiles basés sur Pâques) -----

// Calcule la date de Pâques pour une année donnée (algorithme de Gauss / méthode standard).
function computeEaster(year) {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31); // 3=mars, 4=avril
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(year, month - 1, day);
}

// Liste des jours fériés français pour une année donnée (objets Date).
export function getFrenchHolidays(year) {
  const easter = computeEaster(year);
  const addDaysToDate = (d, n) => { const r = new Date(d); r.setDate(r.getDate() + n); return r; };
  return [
    new Date(year, 0, 1),           // 1er janvier
    addDaysToDate(easter, 1),       // Lundi de Pâques
    new Date(year, 4, 1),           // 1er mai
    new Date(year, 4, 8),           // 8 mai
    addDaysToDate(easter, 39),      // Ascension
    addDaysToDate(easter, 50),      // Lundi de Pentecôte
    new Date(year, 6, 14),          // 14 juillet
    new Date(year, 7, 15),          // 15 août
    new Date(year, 10, 1),          // Toussaint
    new Date(year, 10, 11),         // 11 novembre
    new Date(year, 11, 25),         // Noël
  ];
}

// Indique si une date donnée est un jour férié français.
export function isHoliday(date) {
  const holidays = getFrenchHolidays(date.getFullYear());
  return holidays.some(h => h.getFullYear() === date.getFullYear() && h.getMonth() === date.getMonth() && h.getDate() === date.getDate());
}

// ----- Classification des gardes (G) pour le récapitulatif de paie -----
// 8 catégories distinctes et exclusives : une garde donnée n'appartient qu'à une seule.
// Férié est prioritaire sur le jour de semaine habituel (une garde un dimanche férié
// compte dans "ferie"/"ferieNuit", pas dans "dimancheMatin" etc.)
export const GARDE_CATEGORIES = [
  { id: 'nuitSemaine', label: 'Nuit semaine' },
  { id: 'samediApresMidi', label: 'Samedi après-midi' },
  { id: 'samediNuit', label: 'Samedi nuit' },
  { id: 'dimancheMatin', label: 'Dimanche matin' },
  { id: 'dimancheApresMidi', label: 'Dimanche après-midi' },
  { id: 'dimancheNuit', label: 'Dimanche nuit' },
  { id: 'ferie', label: 'Jours fériés' },
  { id: 'ferieNuit', label: 'Nuit jours fériés' },
];

// Détermine la catégorie d'une garde G pour une date + moment (M/AM/N) donnés.
// Renvoie null si ce n'est pas une garde classifiable (ne devrait pas arriver pour un code G,
// mais reste défensif).
export function classifyGarde(date, moment) {
  const dow = date.getDay(); // 0=dim, 1=lun, ..., 6=sam
  const ferie = isHoliday(date);

  if (ferie) {
    return moment === 'N' ? 'ferieNuit' : 'ferie';
  }
  if (dow === 6) { // samedi
    if (moment === 'AM') return 'samediApresMidi';
    if (moment === 'N') return 'samediNuit';
    return null; // samedi matin = K1, pas une garde
  }
  if (dow === 0) { // dimanche
    if (moment === 'M') return 'dimancheMatin';
    if (moment === 'AM') return 'dimancheApresMidi';
    if (moment === 'N') return 'dimancheNuit';
  }
  // lundi-vendredi
  if (moment === 'N') return 'nuitSemaine';
  return null;
}

// Calcule, pour un agent sur un mois donné, le nombre de gardes dans chacune des 8 catégories.
export function computeGardeBreakdown(agentId, cellules, year, month) {
  const days = getDaysInMonth(year, month);
  const counts = Object.fromEntries(GARDE_CATEGORIES.map(c => [c.id, 0]));
  days.forEach(d => {
    const dk = dateKey(d);
    ['M', 'AM', 'N'].forEach(moment => {
      const code = cellules[`${agentId}|${dk}|${moment}`];
      if (code !== 'G') return;
      const cat = classifyGarde(d, moment);
      if (cat) counts[cat] += 1;
    });
  });
  return counts;
}

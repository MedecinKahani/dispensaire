import { kv } from '@vercel/kv';
import { NextResponse } from 'next/server';

// Config des dispensaires
const DISPENSAIRES = {
  '97670': {
    nom: 'CMR Kahani',
    planningKey: 'planning_v2',
    chefMatricule: '97670', // code postal = accès chef pour Kahani
  },
  '97620': {
    nom: 'Mramadoudou',
    planningKey: 'planning_mramadoudou',
    chefMatricule: '97620', // temporaire = code postal
  },
};

// GET : vérifier un matricule pour un dispensaire
// ?codePostal=97670&matricule=023799
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const codePostal = searchParams.get('codePostal');
  const matricule = searchParams.get('matricule');

  if (!codePostal || !matricule) {
    return NextResponse.json({ error: 'Paramètres manquants' }, { status: 400 });
  }

  const disp = DISPENSAIRES[codePostal];
  if (!disp) {
    return NextResponse.json({ error: 'Dispensaire inconnu' }, { status: 404 });
  }

  // Chef ?
  if (matricule === disp.chefMatricule) {
    return NextResponse.json({ role: 'chef', dispensaire: disp.nom, codePostal });
  }

  // Chercher l'agent dans le planning Redis
  const planning = await kv.get(disp.planningKey);
  if (!planning) {
    return NextResponse.json({ role: 'inconnu', dispensaire: disp.nom, codePostal });
  }

  const agents = planning.medical?.agents || [];
  const agent = agents.find(a => a.matricule === matricule);

  if (agent) {
    return NextResponse.json({
      role: 'medecin',
      agentId: agent.id,
      nom: agent.nomFamille,
      prenom: agent.prenom,
      dispensaire: disp.nom,
      codePostal,
    });
  }

  // Matricule inconnu → première connexion
  return NextResponse.json({ role: 'nouveau', dispensaire: disp.nom, codePostal });
}

// POST : enregistrer le matricule d'un nouvel agent
// body: { codePostal, matricule, nomFamille, prenom }
export async function POST(request) {
  const body = await request.json();
  const { codePostal, matricule, nomFamille, prenom } = body;

  if (!codePostal || !matricule || !nomFamille) {
    return NextResponse.json({ error: 'Paramètres manquants' }, { status: 400 });
  }

  const disp = DISPENSAIRES[codePostal];
  if (!disp) {
    return NextResponse.json({ error: 'Dispensaire inconnu' }, { status: 404 });
  }

  const planning = await kv.get(disp.planningKey) || { medical: { agents: [], cellules: {}, guides: {}, feries: [] } };
  const agents = planning.medical?.agents || [];

  // Vérifier que le matricule n'est pas déjà pris
  if (agents.find(a => a.matricule === matricule)) {
    return NextResponse.json({ error: 'Matricule déjà utilisé' }, { status: 409 });
  }

  // Créer l'agent
  const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  const newAgent = {
    id,
    matricule,
    nomFamille: nomFamille.trim().toUpperCase(),
    prenom: (prenom || '').trim(),
    arrivee: null,
    depart: null,
    tuteurId: null,
  };

  planning.medical.agents = [...agents, newAgent];
  await kv.set(disp.planningKey, planning);

  return NextResponse.json({
    role: 'medecin',
    agentId: id,
    nom: newAgent.nomFamille,
    prenom: newAgent.prenom,
    dispensaire: disp.nom,
    codePostal,
  });
}

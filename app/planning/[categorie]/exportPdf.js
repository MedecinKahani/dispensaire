'use client';

import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { getDaysInMonth, dateKey, JOURS_FR, MOIS_FR, computeAgentStats, formatAgentName, computeGardeBreakdown, GARDE_CATEGORIES } from '../config';

// Génère un PDF paysage : médecins en colonnes, jours du mois en lignes,
// une cellule par jour (code du matin en priorité, sinon AM, sinon N — comme la vue d'ensemble),
// + une page récapitulative des heures/gardes/RS par agent pour la direction des affaires médicales.
export function exportPlanningPDF(category, agents, cellules, year, month) {
  const days = getDaysInMonth(year, month);
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });

  const codeFor = (agentId, dk) => {
    for (const m of ['M', 'AM', 'N']) {
      const c = cellules[`${agentId}|${dk}|${m}`];
      if (c) return c;
    }
    return '';
  };

  const title = `Tableau mensuel de service — ${MOIS_FR[month]} ${year}`;
  const subtitle = `${category.label} — Dispensaire Kahani, Mayotte`;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text(title, 14, 14);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(90, 90, 90);
  doc.text(subtitle, 14, 20);

  // En-tête : Jour | Date | un par médecin
  const head = [['Jour', 'Date', ...agents.map(a => formatAgentName(a))]];

  const body = days.map(d => {
    const dk = dateKey(d);
    const row = [JOURS_FR[d.getDay()], String(d.getDate())];
    agents.forEach(a => row.push(codeFor(a.id, dk)));
    return row;
  });

  autoTable(doc, {
    head,
    body,
    startY: 26,
    styles: { fontSize: 7, cellPadding: 1.2, halign: 'center', valign: 'middle', lineColor: [220, 217, 209], lineWidth: 0.1 },
    headStyles: { fillColor: [26, 43, 61], textColor: 255, fontSize: 7, halign: 'center' },
    columnStyles: { 0: { cellWidth: 12, halign: 'left' }, 1: { cellWidth: 10 } },
    didParseCell: (data) => {
      if (data.section === 'body' && data.column.index >= 2) {
        const code = data.cell.raw;
        const info = category.codes.find(c => c.code === code);
        if (info) {
          const rgb = hexToRgb(info.bg);
          data.cell.styles.fillColor = rgb;
          data.cell.styles.textColor = hexToRgb(info.color);
          data.cell.styles.fontStyle = 'bold';
        }
      }
      // Week-ends en léger gris
      if (data.section === 'body' && data.column.index === 0) {
        if (data.cell.raw === 'Sam' || data.cell.raw === 'Dim') {
          data.row.cells[0].styles.fillColor = [240, 238, 231];
          data.row.cells[1].styles.fillColor = [240, 238, 231];
        }
      }
    },
  });

  // Page récapitulative : heures / gardes de nuit / gardes de jour par agent
  doc.addPage('a4', 'landscape');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text(`Récapitulatif mensuel — ${MOIS_FR[month]} ${year}`, 14, 14);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(90, 90, 90);
  doc.text(`${category.label} — pour la direction des affaires médicales (paiement des gardes)`, 14, 20);

  const recapBody = agents.map(a => {
    const stats = computeAgentStats(category, a.id, cellules, year, month);
    return [
      formatAgentName(a),
      `${stats.heures} h`,
      `${stats.heuresParSemaine.toFixed(1)} h`,
      String(stats.gardesNuit),
      String(stats.gardesJour),
    ];
  });

  autoTable(doc, {
    head: [['Médecin', 'Heures totales (mois)', 'Moy. heures / semaine', 'Gardes de nuit', 'Gardes de jour']],
    body: recapBody,
    startY: 26,
    styles: { fontSize: 10, cellPadding: 3 },
    headStyles: { fillColor: [26, 43, 61], textColor: 255 },
    columnStyles: { 0: { halign: 'left', fontStyle: 'bold' }, 1: { halign: 'center' }, 2: { halign: 'center' }, 3: { halign: 'center' }, 4: { halign: 'center' } },
  });

  // Page 3 : détail des gardes par catégorie (nuit semaine, week-end, fériés...) pour le paiement
  doc.addPage('a4', 'landscape');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text(`Détail des gardes — ${MOIS_FR[month]} ${year}`, 14, 14);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(90, 90, 90);
  doc.text(`${category.label} — cumul par catégorie pour le paiement des gardes`, 14, 20);

  const gardeHead = [['Médecin', ...GARDE_CATEGORIES.map(c => c.label), 'Total gardes']];
  const gardeBody = agents.map(a => {
    const breakdown = computeGardeBreakdown(a.id, cellules, year, month);
    const total = GARDE_CATEGORIES.reduce((sum, c) => sum + breakdown[c.id], 0);
    return [
      formatAgentName(a),
      ...GARDE_CATEGORIES.map(c => String(breakdown[c.id])),
      String(total),
    ];
  });
  // Ligne de total général en bas du tableau
  const totalsRow = ['Total équipe'];
  GARDE_CATEGORIES.forEach(c => {
    const sum = agents.reduce((acc, a) => acc + computeGardeBreakdown(a.id, cellules, year, month)[c.id], 0);
    totalsRow.push(String(sum));
  });
  const grandTotal = agents.reduce((acc, a) => {
    const breakdown = computeGardeBreakdown(a.id, cellules, year, month);
    return acc + GARDE_CATEGORIES.reduce((s, c) => s + breakdown[c.id], 0);
  }, 0);
  totalsRow.push(String(grandTotal));
  gardeBody.push(totalsRow);

  autoTable(doc, {
    head: gardeHead,
    body: gardeBody,
    startY: 26,
    styles: { fontSize: 8, cellPadding: 2, halign: 'center' },
    headStyles: { fillColor: [26, 43, 61], textColor: 255, fontSize: 7.5 },
    columnStyles: { 0: { halign: 'left', fontStyle: 'bold', cellWidth: 42 } },
    didParseCell: (data) => {
      // Met en évidence la ligne de total équipe (dernière ligne du body)
      if (data.section === 'body' && data.row.index === gardeBody.length - 1) {
        data.cell.styles.fillColor = [240, 238, 231];
        data.cell.styles.fontStyle = 'bold';
      }
      // Colonnes fériés (les 2 dernières avant le total) en léger jaune pour les repérer
      if (data.section === 'body' && (data.column.index === 7 || data.column.index === 8) && data.row.index !== gardeBody.length - 1) {
        data.cell.styles.fillColor = [254, 243, 226];
      }
    },
  });

  // Légende sur la première page (en bas)
  doc.setPage(1);
  let legendY = 285;
  doc.setFontSize(7);
  doc.setTextColor(90, 90, 90);
  const legendText = category.codes.map(c => `${c.code} = ${c.label}${c.detail ? ` (${c.detail})` : ''}`).join('   ·   ');
  doc.text(legendText, 14, legendY, { maxWidth: 270 });

  const filename = `planning-${category.id}-${MOIS_FR[month].toLowerCase()}-${year}.pdf`;
  doc.save(filename);
}

function hexToRgb(hex) {
  const h = hex.replace('#', '');
  return [
    parseInt(h.substring(0, 2), 16),
    parseInt(h.substring(2, 4), 16),
    parseInt(h.substring(4, 6), 16),
  ];
}

'use client';

import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { getDaysInMonth, dateKey, JOURS_FR, MOIS_FR, formatAgentName, computeGardeBreakdown, GARDE_CATEGORIES, isCancelledCode } from '../config';

// Génère un PDF paysage : médecins en colonnes, jours du mois en lignes,
// une cellule par jour (code du matin en priorité, sinon AM, sinon N — comme la vue d'ensemble),
// + une page récapitulative des heures/gardes/RS par agent pour la direction des affaires médicales.
export function exportPlanningPDF(category, agents, cellules, year, month) {
  const days = getDaysInMonth(year, month);
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });

  const codeFor = (agentId, dk) => {
    for (const m of ['M', 'AM', 'N']) {
      const c = cellules[`${agentId}|${dk}|${m}`];
      if (c && !isCancelledCode(c)) return c; // un créneau annulé n'apparaît pas dans le document officiel
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

  // Page 2 : détail des gardes + CA/CF pour les affaires médicales
  doc.addPage('a4', 'landscape');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(26, 43, 61);
  doc.text(`Récapitulatif — ${MOIS_FR[month]} ${year}`, 14, 14);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(90, 90, 90);
  doc.text(`${category.label} — pour la direction des affaires médicales`, 14, 20);

  const gardeHead = [['Médecin', ...GARDE_CATEGORIES.map(c => c.label), 'CA', 'CF', 'Total gardes']];

  const gardeBody = agents.map(a => {
    const breakdown = computeGardeBreakdown(a.id, cellules, year, month);
    const total = GARDE_CATEGORIES.reduce((sum, c) => sum + breakdown[c.id], 0);

    // Compter CA et CF sur le mois
    const days = getDaysInMonth(year, month);
    let ca = 0, cf = 0;
    days.forEach(d => {
      const dk = dateKey(d);
      ['M', 'AM', 'N'].forEach(m => {
        const code = cellules[`${a.id}|${dk}|${m}`];
        if (code === 'CA') ca = 1; // journée entière donc 1 par jour suffit
        if (code === 'CF') cf = 1;
      });
      // Compter les jours distincts
    });

    // Recalcul propre : compter les jours (pas les créneaux) où CA ou CF est présent
    let caJours = 0, cfJours = 0;
    days.forEach(d => {
      const dk = dateKey(d);
      const hasCA = ['M', 'AM', 'N'].some(m => cellules[`${a.id}|${dk}|${m}`] === 'CA');
      const hasCF = ['M', 'AM', 'N'].some(m => cellules[`${a.id}|${dk}|${m}`] === 'CF');
      if (hasCA) caJours++;
      if (hasCF) cfJours++;
    });

    return [
      formatAgentName(a),
      ...GARDE_CATEGORIES.map(c => breakdown[c.id] > 0 ? String(breakdown[c.id]) : '–'),
      caJours > 0 ? String(caJours) : '–',
      cfJours > 0 ? String(cfJours) : '–',
      total > 0 ? String(total) : '–',
    ];
  });

  // Ligne total équipe
  const totalsRow = ['Total équipe'];
  GARDE_CATEGORIES.forEach(c => {
    const sum = agents.reduce((acc, a) => acc + computeGardeBreakdown(a.id, cellules, year, month)[c.id], 0);
    totalsRow.push(sum > 0 ? String(sum) : '–');
  });
  // Total CA et CF équipe
  ['CA', 'CF'].forEach(code => {
    const sum = agents.reduce((acc, a) => {
      const days = getDaysInMonth(year, month);
      let count = 0;
      days.forEach(d => {
        const dk = dateKey(d);
        if (['M', 'AM', 'N'].some(m => cellules[`${a.id}|${dk}|${m}`] === code)) count++;
      });
      return acc + count;
    }, 0);
    totalsRow.push(sum > 0 ? String(sum) : '–');
  });
  const grandTotal = agents.reduce((acc, a) => {
    const breakdown = computeGardeBreakdown(a.id, cellules, year, month);
    return acc + GARDE_CATEGORIES.reduce((s, c) => s + breakdown[c.id], 0);
  }, 0);
  totalsRow.push(grandTotal > 0 ? String(grandTotal) : '–');
  gardeBody.push(totalsRow);

  autoTable(doc, {
    head: gardeHead,
    body: gardeBody,
    startY: 26,
    styles: { fontSize: 9, cellPadding: 3, halign: 'center', valign: 'middle' },
    headStyles: { fillColor: [26, 43, 61], textColor: 255, fontSize: 8 },
    columnStyles: {
      0: { halign: 'left', fontStyle: 'bold', cellWidth: 44 },
      7: { fillColor: [236, 253, 243], textColor: [21, 128, 61] }, // CA en vert pâle
      8: { fillColor: [236, 253, 243], textColor: [21, 128, 61] }, // CF en vert pâle
      9: { fontStyle: 'bold' },
    },
    didParseCell: (data) => {
      // Ligne total en gras sur fond gris
      if (data.section === 'body' && data.row.index === gardeBody.length - 1) {
        data.cell.styles.fillColor = [240, 238, 231];
        data.cell.styles.fontStyle = 'bold';
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

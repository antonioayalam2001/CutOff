import type { BillingExpense, BillingResponse } from '@/types';

interface ExportBillingPdfParams {
  groupName: string;
  year: number;
  month: number;
  billing: BillingResponse;
}

interface CardAggregate {
  cardId: string;
  cardName: string;
  lastFourDigits: string;
  cutOffDay: number;
  paymentDeadlineDay: number;
  currentCycleTotal: number;
  nextCycleTotal: number;
  users: Map<
    string,
    {
      userId: string;
      userName: string;
      expenses: BillingExpense[];
      currentCycleTotal: number;
    }
  >;
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(value);
}

function formatMonthLabel(year: number, month: number) {
  return new Date(year, month - 1, 1).toLocaleDateString('es-MX', { month: 'long', year: 'numeric' });
}

function buildCardAggregate(billing: BillingResponse) {
  const cardMap = new Map<string, CardAggregate>();

  for (const user of billing.summary) {
    for (const card of user.cards) {
      if (!cardMap.has(card.cardId)) {
        cardMap.set(card.cardId, {
          cardId: card.cardId,
          cardName: card.cardName,
          lastFourDigits: card.lastFourDigits,
          cutOffDay: card.cutOffDay,
          paymentDeadlineDay: card.paymentDeadlineDay,
          currentCycleTotal: 0,
          nextCycleTotal: 0,
          users: new Map(),
        });
      }

      const aggregate = cardMap.get(card.cardId)!;
      aggregate.currentCycleTotal += card.currentCycleTotal;
      aggregate.nextCycleTotal += card.nextCycleTotal;

      const currentCycleExpenses = card.expenses.filter((expense) => expense.cycle === 'current');
      if (currentCycleExpenses.length > 0) {
        const existing = aggregate.users.get(user.userId) || {
          userId: user.userId,
          userName: user.userName,
          expenses: [],
          currentCycleTotal: 0,
        };

        existing.expenses.push(...currentCycleExpenses);
        existing.currentCycleTotal += currentCycleExpenses.reduce((sum, expense) => sum + expense.amount, 0);
        aggregate.users.set(user.userId, existing);
      }
    }
  }

  return Array.from(cardMap.values());
}

export async function exportBillingPdf({ groupName, year, month, billing }: ExportBillingPdfParams) {
  const [{ default: jsPDF }, { default: autoTable }] = await Promise.all([
    import('jspdf'),
    import('jspdf-autotable'),
  ]);

  const doc = new jsPDF({ orientation: 'p', unit: 'pt', format: 'a4' });
  const pdfDoc = doc as any;
  const marginX = 40;
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const bottomMargin = 42;
  const safeBottom = pageHeight - bottomMargin;
  const ensureSpace = (currentY: number, blockHeight: number) => {
    if (currentY + blockHeight > safeBottom) {
      doc.addPage();
      return 40;
    }
    return currentY;
  };
  const cardAggregates = buildCardAggregate(billing);
  const totalCurrentCycle = billing.summary.reduce((sum, user) => sum + user.totalCurrentCycle, 0);
  const totalNextCycle = billing.summary.reduce((sum, user) => sum + user.totalNextCycle, 0);
  const fileMonth = String(month).padStart(2, '0');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.text(`CutOff · Facturación ${formatMonthLabel(year, month)}`, marginX, 42);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(107, 114, 128);
  doc.text(groupName, marginX, 58);
  doc.text(`Ciclo exportado: ${formatMonthLabel(year, month)}`, marginX, 72);
  doc.text(`Generado: ${new Date().toLocaleString('es-MX')}`, marginX, 86);

  autoTable(doc, {
    startY: 104,
    head: [['Resumen general', 'Valor']],
    body: [
      ['Total ciclo actual', formatCurrency(totalCurrentCycle)],
      ['Total siguiente ciclo', formatCurrency(totalNextCycle)],
      ['Tarjetas incluidas', String(cardAggregates.length)],
    ],
    theme: 'grid',
    styles: {
      font: 'helvetica',
      fontSize: 9,
      cellPadding: 6,
      textColor: [30, 41, 59],
      lineColor: [229, 231, 235],
    },
    headStyles: {
      fillColor: [15, 23, 42],
      textColor: [226, 232, 240],
      fontStyle: 'bold',
    },
    columnStyles: {
      1: { halign: 'right' },
    },
    margin: { left: marginX, right: marginX },
  });

  let cursorY = (pdfDoc.lastAutoTable?.finalY || 104) + 18;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(15, 23, 42);
  cursorY = ensureSpace(cursorY, 42);
  doc.text('Totales por tarjeta', marginX, cursorY);

  autoTable(doc, {
    startY: cursorY + 10,
    head: [['Tarjeta', 'Corte', 'Pago', 'Total ciclo actual']],
    body: cardAggregates.map((card) => [
      `${card.cardName} •••• ${card.lastFourDigits}`,
      String(card.cutOffDay),
      String(card.paymentDeadlineDay),
      formatCurrency(card.currentCycleTotal),
    ]),
    theme: 'grid',
    styles: {
      font: 'helvetica',
      fontSize: 8.5,
      cellPadding: 5,
      textColor: [30, 41, 59],
      lineColor: [229, 231, 235],
    },
    headStyles: {
      fillColor: [6, 182, 212],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
    },
    margin: { left: marginX, right: marginX },
  });

  cursorY = (pdfDoc.lastAutoTable?.finalY || cursorY) + 18;

  cursorY = ensureSpace(cursorY, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(15, 23, 42);
  doc.text('Totales por usuario', marginX, cursorY);

  autoTable(doc, {
    startY: cursorY + 10,
    head: [['Usuario', 'Total ciclo actual', 'Total siguiente ciclo']],
    body: billing.summary.map((user) => [
      user.userName,
      formatCurrency(user.totalCurrentCycle),
      formatCurrency(user.totalNextCycle),
    ]),
    theme: 'grid',
    styles: {
      font: 'helvetica',
      fontSize: 8.8,
      cellPadding: 4,
      textColor: [30, 41, 59],
      lineColor: [229, 231, 235],
      overflow: 'linebreak',
    },
    headStyles: {
      fillColor: [6, 182, 212],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
    },
    margin: { left: marginX, right: marginX },
    columnStyles: {
      0: { cellWidth: pageWidth - marginX * 2 - 140 },
      1: { halign: 'right', cellWidth: 70 },
      2: { halign: 'right', cellWidth: 70 },
    },
  });

  cursorY = (pdfDoc.lastAutoTable?.finalY || cursorY) + 18;

  const currentUsers = billing.summary
    .map((user) => {
      const cards = user.cards
        .map((card) => ({
          ...card,
          currentExpenses: card.expenses.filter((expense) => expense.cycle === 'current'),
        }))
        .filter((card) => card.currentExpenses.length > 0);
      return { ...user, cards };
    })
    .filter((user) => user.cards.length > 0);

  for (const user of currentUsers) {
    cursorY = ensureSpace(cursorY, 34);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.setTextColor(15, 23, 42);
    doc.text(`${user.userName}`, marginX, cursorY);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(71, 85, 105);
    doc.text(`Total ciclo actual: ${formatCurrency(user.totalCurrentCycle)}`, pageWidth - marginX, cursorY, { align: 'right' });
    cursorY += 14;

    for (const card of user.cards) {
      const currentExpenses = card.currentExpenses;

      cursorY = ensureSpace(cursorY, 22);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10.5);
      doc.setTextColor(15, 23, 42);
      doc.text(`${card.cardName} •••• ${card.lastFourDigits}`, marginX, cursorY);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor(71, 85, 105);
      doc.text(`Corte ${card.cutOffDay} | Pago ${card.paymentDeadlineDay} | Total ${formatCurrency(card.currentCycleTotal)}`, pageWidth - marginX, cursorY, { align: 'right' });

      autoTable(doc, {
        startY: cursorY + 6,
        head: [['Fecha', 'Concepto', 'Monto']],
        body: currentExpenses.map((expense) => [
          new Date(expense.transactionDate).toLocaleDateString('es-MX'),
          expense.concept,
          formatCurrency(expense.amount),
        ]),
        foot: [['Subtotal', '', formatCurrency(currentExpenses.reduce((sum, expense) => sum + expense.amount, 0))]],
        theme: 'grid',
        pageBreak: 'auto',
        styles: {
          font: 'helvetica',
          fontSize: 7.8,
          cellPadding: 3.5,
          textColor: [30, 41, 59],
          lineColor: [229, 231, 235],
          overflow: 'linebreak',
        },
        headStyles: {
          fillColor: [15, 23, 42],
          textColor: [226, 232, 240],
          fontStyle: 'bold',
        },
        footStyles: {
          fillColor: [240, 253, 250],
          textColor: [6, 95, 70],
          fontStyle: 'bold',
        },
        margin: { left: marginX, right: marginX },
        columnStyles: {
          0: { cellWidth: 70 },
          1: { cellWidth: pageWidth - marginX * 2 - 70 - 86 },
          2: { halign: 'right', cellWidth: 86 },
        },
      });

      cursorY = (pdfDoc.lastAutoTable?.finalY || cursorY + 6) + 10;
    }

    cursorY += 4;
  }

  const lastY = pdfDoc.lastAutoTable?.finalY || 0;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(107, 114, 128);
  doc.text('Export generado automáticamente por CutOff.', marginX, Math.min(lastY + 20, doc.internal.pageSize.getHeight() - 24));

  doc.save(`cutoff-facturacion-${year}-${fileMonth}.pdf`);
}

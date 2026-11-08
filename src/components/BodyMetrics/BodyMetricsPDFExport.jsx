import React, { useState, useRef } from 'react';
import { FileDown, X, ChevronDown, BarChart2, Loader2, CheckCircle } from 'lucide-react';
import { jsPDF } from 'jspdf';

// ─── Helpers ───────────────────────────────────────────────────────────────────

const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    const [y, m, d] = dateStr.split('-');
    return `${d}/${m}/${y}`;
};

const getAge = (birthDateString) => {
    if (!birthDateString) return null;
    const today = new Date();
    const birth = new Date(birthDateString);
    let age = today.getFullYear() - birth.getFullYear();
    const mo = today.getMonth() - birth.getMonth();
    if (mo < 0 || (mo === 0 && today.getDate() < birth.getDate())) age--;
    return age;
};

const calcIMC = (weight, heightCm) => {
    if (!weight || !heightCm) return null;
    const h = heightCm / 100;
    return (weight / (h * h)).toFixed(1);
};

const imcClassification = (imc) => {
    if (imc === null) return '';
    const v = parseFloat(imc);
    if (v < 18.5) return 'Abaixo do peso';
    if (v < 25) return 'Peso normal';
    if (v < 30) return 'Sobrepeso';
    if (v < 35) return 'Obesidade Grau I';
    if (v < 40) return 'Obesidade Grau II';
    return 'Obesidade Grau III';
};

const bodyFatClassification = (fat, gender) => {
    if (!fat) return '';
    const v = parseFloat(fat);
    if (gender === 'female') {
        if (v < 14) return 'Abaixo do essencial';
        if (v < 21) return 'Atlética';
        if (v < 25) return 'Boa forma';
        if (v < 32) return 'Aceitável';
        return 'Acima do recomendado';
    } else {
        if (v < 6) return 'Abaixo do essencial';
        if (v < 14) return 'Atlético';
        if (v < 18) return 'Boa forma';
        if (v < 25) return 'Aceitável';
        return 'Acima do recomendado';
    }
};

const leanMass = (weight, fat) => {
    if (!weight || !fat) return null;
    return (weight - (weight * fat / 100)).toFixed(1);
};

const diff = (a, b, inverted = false) => {
    if (a == null || b == null) return null;
    const d = (parseFloat(b) - parseFloat(a)).toFixed(1);
    return { value: d, positive: inverted ? parseFloat(d) <= 0 : parseFloat(d) >= 0 };
};

const CIRC_LABELS = {
    neck: 'Pescoço', shoulder: 'Ombro', chest: 'Tórax',
    armRight: 'Braço Dir.', armLeft: 'Braço Esq.',
    forearmRight: 'Antebraço Dir.', forearmLeft: 'Antebraço Esq.',
    waist: 'Cintura', abdomen: 'Abdômen', hips: 'Quadril',
    thighRight: 'Coxa Dir.', thighLeft: 'Coxa Esq.',
    calfRight: 'Panturrilha Dir.', calfLeft: 'Panturrilha Esq.'
};

const SKINFOLD_LABELS = {
    chest: 'Peitoral', axilla: 'Axilar Média', triceps: 'Tríceps',
    subscapular: 'Subescapular', abdomen: 'Abdominal',
    suprailiac: 'Supra-ilíaca', thigh: 'Coxa'
};

// ─── PDF Generator ─────────────────────────────────────────────────────────────

const BRAND = { r: 139, g: 92, b: 246 }; // Purple accent
const DARK = { r: 15, g: 23, b: 42 };
const GRAY = { r: 100, g: 116, b: 139 };
const LIGHT_BG = { r: 248, g: 250, b: 252 };
const WHITE = { r: 255, g: 255, b: 255 };
const GREEN = { r: 34, g: 197, b: 94 };
const RED = { r: 239, g: 68, b: 68 };

const setColor = (doc, { r, g, b }) => doc.setTextColor(r, g, b);
const setFill = (doc, { r, g, b }) => doc.setFillColor(r, g, b);
const setDraw = (doc, { r, g, b }) => doc.setDrawColor(r, g, b);

function drawRect(doc, x, y, w, h, fill, draw = null) {
    setFill(doc, fill);
    if (draw) setDraw(doc, draw);
    else doc.setDrawColor(255, 255, 255);
    doc.roundedRect(x, y, w, h, 3, 3, draw ? 'FD' : 'F');
}

function drawHeader(doc, studentName, evalADate, evalBDate, isComparison) {
    const W = doc.internal.pageSize.getWidth();

    // Header band
    setFill(doc, { r: 10, g: 15, b: 35 });
    doc.rect(0, 0, W, 42, 'F');

    // Purple accent bar
    setFill(doc, BRAND);
    doc.rect(0, 0, 5, 42, 'F');

    // Title
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    setColor(doc, WHITE);
    doc.text('AVALIAÇÃO FÍSICA', 14, 16);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    setColor(doc, { r: 148, g: 163, b: 184 });
    doc.text('Medidas Corporais & Composição Corporal', 14, 24);

    // Athlete name + dates
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    setColor(doc, WHITE);
    doc.text(studentName, 14, 35);

    const dateLabel = isComparison
        ? `${formatDate(evalADate)}  →  ${formatDate(evalBDate)}`
        : formatDate(evalADate);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    setColor(doc, { r: 148, g: 163, b: 184 });
    doc.text(dateLabel, W - 14, 35, { align: 'right' });

    // Brand name right
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    setColor(doc, BRAND);
    doc.text('TREINO DAS FOFAS', W - 14, 16, { align: 'right' });
}

function drawSectionTitle(doc, text, y) {
    const W = doc.internal.pageSize.getWidth();
    setFill(doc, { r: 243, g: 240, b: 255 });
    doc.rect(10, y, W - 20, 9, 'F');
    setFill(doc, BRAND);
    doc.rect(10, y, 3, 9, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    setColor(doc, BRAND);
    doc.text(text.toUpperCase(), 16, y + 6.2);
    return y + 14;
}

function drawKpiCards(doc, cards, startY) {
    const W = doc.internal.pageSize.getWidth();
    const cardW = (W - 20 - (cards.length - 1) * 4) / cards.length;
    cards.forEach((card, i) => {
        const x = 10 + i * (cardW + 4);
        drawRect(doc, x, startY, cardW, 24, LIGHT_BG, { r: 226, g: 232, b: 240 });

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7.5);
        setColor(doc, GRAY);
        doc.text(card.label, x + cardW / 2, startY + 7, { align: 'center' });

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(13);
        setColor(doc, DARK);
        doc.text(String(card.value ?? '-'), x + cardW / 2, startY + 17, { align: 'center' });

        if (card.sub) {
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(7);
            setColor(doc, GRAY);
            doc.text(card.sub, x + cardW / 2, startY + 22.5, { align: 'center' });
        }
    });
    return startY + 29;
}

function drawTable(doc, headers, rows, startY, options = {}) {
    const W = doc.internal.pageSize.getWidth();
    const colCount = headers.length;
    const margin = 10;
    const tableW = W - margin * 2;
    const colW = options.colWidths || Array(colCount).fill(tableW / colCount);

    // Header row
    setFill(doc, { r: 10, g: 15, b: 35 });
    doc.rect(margin, startY, tableW, 8, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    setColor(doc, WHITE);
    let xPos = margin;
    headers.forEach((h, i) => {
        const align = i > 0 ? 'center' : 'left';
        const textX = align === 'left' ? xPos + 3 : xPos + colW[i] / 2;
        doc.text(h, textX, startY + 5.5, { align });
        xPos += colW[i];
    });

    let y = startY + 8;
    rows.forEach((row, ri) => {
        const rowH = 7.5;
        // Alternating bg
        setFill(doc, ri % 2 === 0 ? WHITE : LIGHT_BG);
        doc.rect(margin, y, tableW, rowH, 'F');

        // border bottom
        setDraw(doc, { r: 226, g: 232, b: 240 });
        doc.setLineWidth(0.2);
        doc.line(margin, y + rowH, margin + tableW, y + rowH);

        xPos = margin;
        row.forEach((cell, ci) => {
            doc.setFont('helvetica', ci === 0 ? 'normal' : 'bold');
            doc.setFontSize(7.5);

            // color for diff cells
            if (typeof cell === 'object' && cell !== null) {
                const isPositive = cell.positive;
                setColor(doc, isPositive ? GREEN : RED);
                doc.text(String(cell.text ?? '-'), xPos + colW[ci] / 2, y + 5.2, { align: 'center' });
            } else {
                setColor(doc, ci === 0 ? GRAY : DARK);
                const align = ci === 0 ? 'left' : 'center';
                const textX = align === 'left' ? xPos + 3 : xPos + colW[ci] / 2;
                doc.text(String(cell ?? '-'), textX, y + 5.2, { align });
            }
            xPos += colW[ci];
        });
        y += rowH;
    });

    return y + 4;
}

function drawLineChart(doc, data, label, unit, x, y, w, h, color = BRAND) {
    if (!data || data.length < 2) return y + h + 6;

    const pad = { l: 28, r: 8, t: 20, b: 18 };
    const plotW = w - pad.l - pad.r;
    const plotH = h - pad.t - pad.b;

    const vals = data.map(d => parseFloat(d.v) || 0);
    const minV = Math.min(...vals);
    const maxV = Math.max(...vals);
    const range = maxV - minV || 1;

    // Background
    drawRect(doc, x, y, w, h, LIGHT_BG);

    // Title
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    setColor(doc, DARK);
    doc.text(label, x + pad.l, y + 12);

    // Y axis ticks
    const ticks = 4;
    for (let t = 0; t <= ticks; t++) {
        const val = minV + (range / ticks) * t;
        const ty = y + pad.t + plotH - (plotH / ticks) * t;
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(6);
        setColor(doc, GRAY);
        doc.text(val.toFixed(1), x + pad.l - 3, ty + 2, { align: 'right' });
        // gridline
        setDraw(doc, { r: 226, g: 232, b: 240 });
        doc.setLineWidth(0.2);
        doc.line(x + pad.l, ty, x + pad.l + plotW, ty);
    }

    // Data points & lines
    const points = data.map((d, i) => {
        const px = x + pad.l + (plotW / (data.length - 1)) * i;
        const py = y + pad.t + plotH - ((parseFloat(d.v) - minV) / range) * plotH;
        return { px, py, label: d.label };
    });

    // Area fill
    doc.setFillColor(color.r, color.g, color.b);
    doc.setGState && doc.setGState(new doc.GState({ opacity: 0.1 }));

    // Draw line segments
    doc.setDrawColor(color.r, color.g, color.b);
    doc.setLineWidth(1.2);
    for (let i = 1; i < points.length; i++) {
        doc.line(points[i - 1].px, points[i - 1].py, points[i].px, points[i].py);
    }

    // X axis labels
    points.forEach((pt, i) => {
        if (i === 0 || i === points.length - 1 || (data.length <= 6)) {
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(5.5);
            setColor(doc, GRAY);
            doc.text(pt.label, pt.px, y + pad.t + plotH + 8, { align: 'center' });
        }
    });

    // Dots
    setFill(doc, color);
    setDraw(doc, WHITE);
    doc.setLineWidth(0.5);
    points.forEach(pt => {
        doc.circle(pt.px, pt.py, 1.5, 'FD');
    });

    // Unit label
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6);
    setColor(doc, GRAY);
    doc.text(unit, x + w - pad.r, y + 12, { align: 'right' });

    return y + h + 6;
}

function drawBarChart(doc, data, title, x, y, w, h) {
    if (!data || data.length === 0) return y + h + 6;

    const pad = { l: 60, r: 8, t: 20, b: 10 };
    const plotW = w - pad.l - pad.r;
    const plotH = h - pad.t - pad.b;

    const allVals = data.flatMap(d => [d.a, d.b].filter(v => v != null));
    const maxV = Math.max(...allVals, 1);

    drawRect(doc, x, y, w, h, LIGHT_BG);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    setColor(doc, DARK);
    doc.text(title, x + pad.l, y + 12);

    const barH = Math.min((plotH / data.length) - 3, 7);
    const hasB = data.some(d => d.b != null);

    data.forEach((item, i) => {
        const rowH = plotH / data.length;
        const baseY = y + pad.t + i * rowH + (rowH - (hasB ? barH * 2 + 2 : barH)) / 2;

        // Label
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(6.5);
        setColor(doc, GRAY);
        doc.text(item.label, x + pad.l - 3, baseY + barH / 2 + 2, { align: 'right' });

        if (item.a != null) {
            const bw = (parseFloat(item.a) / maxV) * plotW;
            setFill(doc, BRAND);
            doc.rect(x + pad.l, baseY, bw, barH, 'F');
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(5.5);
            setColor(doc, BRAND);
            doc.text(String(item.a), x + pad.l + bw + 1.5, baseY + barH / 2 + 2);
        }
        if (hasB && item.b != null) {
            const bw2 = (parseFloat(item.b) / maxV) * plotW;
            setFill(doc, { r: 34, g: 211, b: 238 });
            doc.rect(x + pad.l, baseY + barH + 2, bw2, barH, 'F');
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(5.5);
            setColor(doc, { r: 14, g: 165, b: 233 });
            doc.text(String(item.b), x + pad.l + bw2 + 1.5, baseY + barH * 2 + 3.5);
        }
    });

    // Legend
    if (hasB) {
        setFill(doc, BRAND);
        doc.rect(x + pad.l, y + h - 8, 6, 3, 'F');
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(6);
        setColor(doc, GRAY);
        doc.text('Anterior', x + pad.l + 7, y + h - 5.5);

        setFill(doc, { r: 34, g: 211, b: 238 });
        doc.rect(x + pad.l + 32, y + h - 8, 6, 3, 'F');
        doc.text('Atual', x + pad.l + 39, y + h - 5.5);
    }

    return y + h + 6;
}

function interpretationText(metric, value, gender) {
    if (value == null) return null;
    const v = parseFloat(value);
    switch (metric) {
        case 'bodyFat': {
            const cls = bodyFatClassification(v, gender);
            const optimal = gender === 'female' ? '21-24%' : '14-17%';
            return `Gordura corporal em ${v}% — classificação: ${cls}. Faixa de boa forma: ${optimal}.`;
        }
        case 'imc': {
            const cls = imcClassification(v);
            return `IMC de ${v} kg/m² — classificação: ${cls}. Faixa saudável: 18,5–24,9.`;
        }
        case 'waist':
            if (gender === 'female') return `Cintura de ${v} cm. Risco cardiovascular elevado acima de 88 cm (OMS).`;
            return `Cintura de ${v} cm. Risco cardiovascular elevado acima de 102 cm (OMS).`;
        default: return null;
    }
}

// ─── Main PDF Build Function ───────────────────────────────────────────────────

async function generatePDF(evalA, evalB, student, allMetrics) {
    const doc = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' });
    const W = doc.internal.pageSize.getWidth();
    const H = doc.internal.pageSize.getHeight();
    const isComparison = !!evalB;
    const gender = student?.gender || 'female';
    const age = getAge(student?.birthDate);
    const heightCm = student?.height || student?.profile_data?.height || null;
    const studentName = student?.name || 'Atleta';

    const imcA = calcIMC(evalA?.weight, heightCm);
    const imcB = isComparison ? calcIMC(evalB?.weight, heightCm) : null;
    const leanA = leanMass(evalA?.weight, evalA?.bodyFat);
    const leanB = isComparison ? leanMass(evalB?.weight, evalB?.bodyFat) : null;

    // ── PAGE 1: Capa & KPI ───────────────────────────────────────────────────
    drawHeader(doc, studentName, evalA?.date, evalB?.date, isComparison);

    let curY = 50;

    // Student info
    curY = drawSectionTitle(doc, 'Dados do Atleta', curY);
    const infoCards = [
        { label: 'Atleta', value: studentName.split(' ').slice(0, 2).join(' ') },
        { label: 'Idade', value: age ? `${age} anos` : '-' },
        { label: 'Sexo', value: gender === 'female' ? 'Feminino' : 'Masculino' },
        { label: 'Avaliações', value: allMetrics.length },
    ];
    if (heightCm) infoCards.splice(3, 0, { label: 'Estatura', value: `${heightCm} cm` });
    curY = drawKpiCards(doc, infoCards.slice(0, 4), curY);

    // Main KPI
    curY = drawSectionTitle(doc, isComparison ? 'Comparativo de Métricas Principais' : 'Métricas Principais', curY);

    const kpiRow1 = [
        { label: 'Peso', value: `${evalA?.weight ?? '-'} kg`, sub: isComparison && evalB?.weight ? `Atual: ${evalB.weight} kg` : '' },
        { label: '% Gordura', value: evalA?.bodyFat ? `${evalA.bodyFat}%` : '-', sub: isComparison && evalB?.bodyFat ? `Atual: ${evalB.bodyFat}%` : bodyFatClassification(evalA?.bodyFat, gender) },
        { label: 'IMC', value: imcA || '-', sub: isComparison && imcB ? `Atual: ${imcB}` : imcClassification(imcA) },
        { label: 'Massa Magra', value: leanA ? `${leanA} kg` : '-', sub: isComparison && leanB ? `Atual: ${leanB} kg` : '' },
    ];
    curY = drawKpiCards(doc, kpiRow1, curY);

    if (isComparison) {
        // Delta cards
        const dW = diff(evalA?.weight, evalB?.weight, true);
        const dFat = diff(evalA?.bodyFat, evalB?.bodyFat, true);
        const dLean = diff(leanA, leanB);
        const dImc = diff(imcA, imcB, true);

        const deltaCards = [
            { label: 'Δ Peso', value: dW ? `${dW.value > 0 ? '+' : ''}${dW.value} kg` : '-', sub: dW ? (dW.positive ? '✓ Melhora' : '↑ Atenção') : '' },
            { label: 'Δ Gordura', value: dFat ? `${dFat.value > 0 ? '+' : ''}${dFat.value}%` : '-', sub: dFat ? (dFat.positive ? '✓ Melhora' : '↑ Atenção') : '' },
            { label: 'Δ Massa Magra', value: dLean ? `${dLean.value > 0 ? '+' : ''}${dLean.value} kg` : '-', sub: dLean ? (dLean.positive ? '✓ Melhora' : '↓ Atenção') : '' },
            { label: 'Δ IMC', value: dImc ? `${dImc.value > 0 ? '+' : ''}${dImc.value}` : '-', sub: dImc ? (dImc.positive ? '✓ Melhora' : '↑ Atenção') : '' },
        ];
        curY = drawKpiCards(doc, deltaCards, curY);
    }

    // Circumferences comparison table
    if (evalA?.circumferences || (isComparison && evalB?.circumferences)) {
        const circKeys = Object.keys(CIRC_LABELS);
        const hasData = circKeys.some(k => evalA?.circumferences?.[k] || evalB?.circumferences?.[k]);
        if (hasData) {
            curY = drawSectionTitle(doc, 'Perimetria (cm)', curY);
            if (isComparison) {
                const tableHeaders = ['Medida', 'Anterior', 'Atual', 'Variação'];
                const colWidths = [70, 35, 35, 50];
                const tableRows = circKeys
                    .filter(k => evalA?.circumferences?.[k] || evalB?.circumferences?.[k])
                    .map(k => {
                        const a = evalA?.circumferences?.[k];
                        const b = evalB?.circumferences?.[k];
                        const d = diff(a, b, true);
                        return [
                            CIRC_LABELS[k],
                            a ? `${a} cm` : '-',
                            b ? `${b} cm` : '-',
                            d ? { text: `${d.value > 0 ? '+' : ''}${d.value} cm`, positive: d.positive } : '-'
                        ];
                    });
                if (curY + tableRows.length * 7.5 + 20 > H - 20) {
                    doc.addPage();
                    drawHeader(doc, studentName, evalA?.date, evalB?.date, isComparison);
                    curY = 52;
                }
                curY = drawTable(doc, tableHeaders, tableRows, curY, { colWidths });
            } else {
                const tableHeaders = ['Medida', 'Valor'];
                const colWidths = [130, 60];
                const tableRows = circKeys
                    .filter(k => evalA?.circumferences?.[k])
                    .map(k => [CIRC_LABELS[k], `${evalA.circumferences[k]} cm`]);
                if (tableRows.length > 0) {
                    if (curY + tableRows.length * 7.5 + 20 > H - 20) {
                        doc.addPage();
                        drawHeader(doc, studentName, evalA?.date, evalB?.date, isComparison);
                        curY = 52;
                    }
                    curY = drawTable(doc, tableHeaders, tableRows, curY, { colWidths });
                }
            }
        }
    }

    // ── PAGE N: Skinfolds ───────────────────────────────────────────────────
    const skinfoldKeys = Object.keys(SKINFOLD_LABELS);
    const hasSkinfolds = skinfoldKeys.some(k => evalA?.skinfolds?.[k] || evalB?.skinfolds?.[k]);
    if (hasSkinfolds) {
        doc.addPage();
        drawHeader(doc, studentName, evalA?.date, evalB?.date, isComparison);
        curY = 52;

        curY = drawSectionTitle(doc, 'Dobras Cutâneas — Protocolo Pollock 7 (mm)', curY);

        const sum7A = skinfoldKeys.reduce((s, k) => s + (parseFloat(evalA?.skinfolds?.[k]) || 0), 0);
        const sum7B = isComparison ? skinfoldKeys.reduce((s, k) => s + (parseFloat(evalB?.skinfolds?.[k]) || 0), 0) : null;

        if (isComparison) {
            const sfHeaders = ['Ponto', 'Anterior (mm)', 'Atual (mm)', 'Variação'];
            const sfWidths = [70, 40, 40, 40];
            const sfRows = skinfoldKeys.map(k => {
                const a = evalA?.skinfolds?.[k];
                const b = evalB?.skinfolds?.[k];
                const d = diff(a, b, true);
                return [
                    SKINFOLD_LABELS[k],
                    a || '-',
                    b || '-',
                    d ? { text: `${d.value > 0 ? '+' : ''}${d.value}`, positive: d.positive } : '-'
                ];
            });
            sfRows.push(['SOMA 7 DOBRAS', sum7A.toFixed(1), sum7B?.toFixed(1) ?? '-', diff(sum7A, sum7B, true) ? { text: `${(sum7B - sum7A).toFixed(1) > 0 ? '+' : ''}${(sum7B - sum7A).toFixed(1)}`, positive: (sum7B - sum7A) <= 0 } : '-']);
            curY = drawTable(doc, sfHeaders, sfRows, curY, { colWidths: sfWidths });
        } else {
            const sfHeaders = ['Ponto', 'Valor (mm)'];
            const sfWidths = [130, 60];
            const sfRows = skinfoldKeys.map(k => [SKINFOLD_LABELS[k], evalA?.skinfolds?.[k] || '-']);
            sfRows.push(['SOMA 7 DOBRAS', sum7A.toFixed(1)]);
            curY = drawTable(doc, sfHeaders, sfRows, curY, { colWidths: sfWidths });
        }

        // Explanation text
        curY += 2;
        drawRect(doc, 10, curY, W - 20, 24, { r: 243, g: 240, b: 255 }, { r: 221, g: 214, b: 254 });
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(7.5);
        setColor(doc, BRAND);
        doc.text('Sobre o Protocolo Pollock 7', 14, curY + 7);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7);
        setColor(doc, DARK);
        const poly = 'O protocolo Jackson & Pollock 7 dobras utiliza medidas de sete pontos específicos do corpo para estimar a densidade corporal pela equação de regressão, convertida em % gordura pela equação de Siri. É amplamente utilizado em academias e laboratórios de avaliação física por sua precisão e reprodutibilidade.';
        const lines = doc.splitTextToSize(poly, W - 28);
        doc.text(lines, 14, curY + 14);
        curY += 30;
    }

    // ── PAGE N+1: Graphs ─────────────────────────────────────────────────────
    doc.addPage();
    drawHeader(doc, studentName, evalA?.date, evalB?.date, isComparison);
    curY = 52;

    curY = drawSectionTitle(doc, 'Evolução ao Longo do Tempo', curY);

    const sortedAll = [...allMetrics].sort((a, b) => new Date(a.date) - new Date(b.date));

    // Weight chart
    const weightData = sortedAll.map(m => ({ v: m.weight, label: formatDate(m.date).slice(0, 5) }));
    curY = drawLineChart(doc, weightData, 'Peso Corporal', 'kg', 10, curY, W - 20, 55, BRAND);

    // Body fat chart
    const fatData = sortedAll.filter(m => m.bodyFat).map(m => ({ v: m.bodyFat, label: formatDate(m.date).slice(0, 5) }));
    if (fatData.length >= 2) {
        curY = drawLineChart(doc, fatData, 'Percentual de Gordura Corporal', '%', 10, curY, W - 20, 55, { r: 236, g: 72, b: 153 });
    }

    // Perimetry bar chart for comparison
    if (isComparison) {
        const circCompData = Object.keys(CIRC_LABELS)
            .filter(k => evalA?.circumferences?.[k] || evalB?.circumferences?.[k])
            .map(k => ({
                label: CIRC_LABELS[k],
                a: parseFloat(evalA?.circumferences?.[k]) || null,
                b: parseFloat(evalB?.circumferences?.[k]) || null
            }));
        if (circCompData.length > 0) {
            if (curY + 70 > H - 20) {
                doc.addPage();
                drawHeader(doc, studentName, evalA?.date, evalB?.date, isComparison);
                curY = 52;
            }
            curY = drawBarChart(doc, circCompData, 'Comparativo de Perimetria (cm)', 10, curY, W - 20, Math.min(80, 10 + circCompData.length * 10));
        }
    }

    // ── PAGE LAST: Interpretation ────────────────────────────────────────────
    if (curY + 60 > H - 20) {
        doc.addPage();
        drawHeader(doc, studentName, evalA?.date, evalB?.date, isComparison);
        curY = 52;
    } else {
        curY += 4;
    }

    const targetEval = isComparison ? evalB : evalA;
    const imcTarget = isComparison ? imcB : imcA;

    curY = drawSectionTitle(doc, 'Análise & Interpretação', curY);

    const interpretations = [
        interpretationText('bodyFat', targetEval?.bodyFat, gender),
        interpretationText('imc', imcTarget, gender),
        interpretationText('waist', targetEval?.circumferences?.waist, gender),
    ].filter(Boolean);

    // Positive evolution message
    if (isComparison) {
        const improvements = [];
        const dW = diff(evalA?.weight, evalB?.weight, true);
        const dFat = diff(evalA?.bodyFat, evalB?.bodyFat, true);
        const dLean = diff(leanA, leanB);
        if (dW?.positive && parseFloat(dW.value) !== 0) improvements.push('redução de peso');
        if (dFat?.positive && parseFloat(dFat.value) !== 0) improvements.push('redução da gordura corporal');
        if (dLean?.positive && parseFloat(dLean.value) !== 0) improvements.push('ganho de massa magra');

        if (improvements.length > 0) {
            interpretations.unshift(`🎉 Parabéns pelo progresso! Neste período foram registradas melhorias em: ${improvements.join(', ')}.`);
        } else {
            interpretations.unshift('Continue mantendo a consistência nos treinos e na alimentação. Cada sessão conta!');
        }
    }

    interpretations.forEach((text, i) => {
        const bgColor = i === 0 && isComparison
            ? { r: 240, g: 253, b: 244 }
            : { r: 248, g: 250, b: 252 };
        const textLines = doc.splitTextToSize(text, W - 32);
        const boxH = textLines.length * 5 + 10;
        drawRect(doc, 10, curY, W - 20, boxH, bgColor, { r: 226, g: 232, b: 240 });

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7.5);
        setColor(doc, DARK);
        doc.text(textLines, 14, curY + 7);
        curY += boxH + 4;
    });

    // Footer on all pages
    const pageCount = doc.getNumberOfPages();
    for (let p = 1; p <= pageCount; p++) {
        doc.setPage(p);
        const footY = H - 8;
        setFill(doc, { r: 243, g: 244, b: 246 });
        doc.rect(0, H - 14, W, 14, 'F');
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(6.5);
        setColor(doc, GRAY);
        doc.text('Treino das Fofas — Avaliação Física Confidencial', 10, footY);
        doc.text(`Gerado em: ${new Date().toLocaleDateString('pt-BR')}`, W / 2, footY, { align: 'center' });
        doc.text(`Pág. ${p} / ${pageCount}`, W - 10, footY, { align: 'right' });
    }

    // Download
    const filename = `avaliacao_${studentName.replace(/\s/g, '_')}_${evalA.date}${isComparison ? `_vs_${evalB.date}` : ''}.pdf`;
    doc.save(filename);
}

// ─── Modal UI Component ────────────────────────────────────────────────────────

const BodyMetricsPDFExport = ({ metrics = [], student }) => {
    const [open, setOpen] = useState(false);
    const [mode, setMode] = useState('single'); // 'single' | 'compare'
    const [evalAId, setEvalAId] = useState('');
    const [evalBId, setEvalBId] = useState('');
    const [loading, setLoading] = useState(false);
    const [done, setDone] = useState(false);

    const sorted = [...metrics].sort((a, b) => new Date(b.date) - new Date(a.date));
    const evalA = sorted.find(m => m.id === evalAId) || sorted[0];
    const evalB = sorted.find(m => m.id === evalBId) || (sorted.length > 1 ? sorted[sorted.length - 1] : null);

    const handleOpen = () => {
        setOpen(true);
        setDone(false);
        setMode(sorted.length >= 2 ? 'compare' : 'single');
        setEvalAId(sorted[sorted.length - 1]?.id || ''); // oldest as "before"
        setEvalBId(sorted[0]?.id || '');                   // newest as "current"
    };

    const handleGenerate = async () => {
        setLoading(true);
        try {
            const a = mode === 'compare'
                ? sorted.find(m => m.id === evalAId) || sorted[sorted.length - 1]
                : sorted.find(m => m.id === evalAId) || sorted[0];
            const b = mode === 'compare'
                ? sorted.find(m => m.id === evalBId) || sorted[0]
                : null;

            await generatePDF(a, b, student, metrics);
            setDone(true);
            setTimeout(() => { setOpen(false); setDone(false); }, 2000);
        } catch (err) {
            console.error('PDF generation failed:', err);
            alert('Erro ao gerar PDF. Tente novamente.');
        } finally {
            setLoading(false);
        }
    };

    if (metrics.length === 0) return null;

    return (
        <>
            {/* Trigger Button */}
            <button
                id="btn-export-pdf-avaliation"
                onClick={handleOpen}
                style={{
                    display: 'flex', alignItems: 'center', gap: '8px',
                    padding: '10px 18px', borderRadius: '10px', border: 'none', cursor: 'pointer',
                    background: 'linear-gradient(135deg, #7c3aed, #a855f7)',
                    color: '#fff', fontWeight: 700, fontSize: '0.9rem',
                    boxShadow: '0 4px 15px rgba(124,58,237,0.4)',
                    transition: 'all 0.2s ease',
                }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(124,58,237,0.5)'; }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 15px rgba(124,58,237,0.4)'; }}
            >
                <FileDown size={18} />
                Exportar PDF
            </button>

            {/* Modal */}
            {open && (
                <div style={{
                    position: 'fixed', inset: 0, zIndex: 9999,
                    background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(6px)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    padding: '1rem',
                }}>
                    <div style={{
                        background: 'var(--bg-primary, #0f172a)',
                        border: '1px solid rgba(124,58,237,0.3)',
                        borderRadius: '20px', padding: '2rem', width: '100%', maxWidth: '480px',
                        boxShadow: '0 25px 60px rgba(0,0,0,0.5)',
                        animation: 'slideUp 0.3s ease',
                    }}>
                        {/* Modal Header */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <div style={{
                                    width: '36px', height: '36px', borderRadius: '10px',
                                    background: 'linear-gradient(135deg, #7c3aed, #a855f7)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                                }}>
                                    <FileDown size={18} color="#fff" />
                                </div>
                                <div>
                                    <div style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--text-primary, #fff)' }}>Exportar Avaliação</div>
                                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted, #64748b)' }}>Gerar relatório em PDF</div>
                                </div>
                            </div>
                            <button onClick={() => setOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted, #64748b)', padding: '4px' }}>
                                <X size={20} />
                            </button>
                        </div>

                        {/* Mode Selector */}
                        <div style={{ marginBottom: '1.5rem' }}>
                            <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary, #94a3b8)', display: 'block', marginBottom: '8px' }}>TIPO DE RELATÓRIO</label>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                                {[
                                    { key: 'single', label: 'Avaliação Única', desc: 'Exibe uma avaliação com todos os dados', icon: '📋' },
                                    { key: 'compare', label: 'Comparativo', desc: 'Compara duas avaliações entre si', icon: '📊', disabled: sorted.length < 2 },
                                ].map(opt => (
                                    <button
                                        key={opt.key}
                                        disabled={opt.disabled}
                                        onClick={() => !opt.disabled && setMode(opt.key)}
                                        style={{
                                            padding: '12px', borderRadius: '12px', cursor: opt.disabled ? 'not-allowed' : 'pointer',
                                            border: `2px solid ${mode === opt.key ? '#7c3aed' : 'rgba(255,255,255,0.08)'}`,
                                            background: mode === opt.key ? 'rgba(124,58,237,0.15)' : 'rgba(255,255,255,0.03)',
                                            textAlign: 'left', transition: 'all 0.2s',
                                            opacity: opt.disabled ? 0.4 : 1,
                                        }}
                                    >
                                        <div style={{ fontSize: '1.2rem', marginBottom: '4px' }}>{opt.icon}</div>
                                        <div style={{ fontWeight: 700, fontSize: '0.82rem', color: mode === opt.key ? '#a78bfa' : 'var(--text-primary, #fff)', marginBottom: '2px' }}>{opt.label}</div>
                                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted, #64748b)', lineHeight: 1.3 }}>{opt.desc}</div>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Evaluation Selectors */}
                        {mode === 'single' ? (
                            <div style={{ marginBottom: '1.5rem' }}>
                                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary, #94a3b8)', display: 'block', marginBottom: '8px' }}>SELECIONAR AVALIAÇÃO</label>
                                <div style={{ position: 'relative' }}>
                                    <select
                                        id="pdf-eval-single"
                                        value={evalAId}
                                        onChange={e => setEvalAId(e.target.value)}
                                        style={{
                                            width: '100%', padding: '10px 36px 10px 12px',
                                            borderRadius: '10px', border: '1px solid rgba(255,255,255,0.12)',
                                            background: 'rgba(255,255,255,0.05)', color: 'var(--text-primary, #fff)',
                                            fontSize: '0.9rem', appearance: 'none', cursor: 'pointer',
                                        }}
                                    >
                                        {sorted.map(m => (
                                            <option key={m.id} value={m.id} style={{ background: '#1e293b' }}>
                                                {formatDate(m.date)} — {m.weight} kg{m.bodyFat ? ` • ${m.bodyFat}% gord.` : ''}
                                            </option>
                                        ))}
                                    </select>
                                    <ChevronDown size={16} style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', color: '#64748b', pointerEvents: 'none' }} />
                                </div>
                            </div>
                        ) : (
                            <div style={{ marginBottom: '1.5rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                {[
                                    { label: '📅 AVALIAÇÃO ANTERIOR', value: evalAId, onChange: setEvalAId, id: 'pdf-eval-a' },
                                    { label: '📅 AVALIAÇÃO ATUAL', value: evalBId, onChange: setEvalBId, id: 'pdf-eval-b' },
                                ].map(sel => (
                                    <div key={sel.id}>
                                        <label style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-secondary, #94a3b8)', display: 'block', marginBottom: '6px' }}>{sel.label}</label>
                                        <div style={{ position: 'relative' }}>
                                            <select
                                                id={sel.id}
                                                value={sel.value}
                                                onChange={e => sel.onChange(e.target.value)}
                                                style={{
                                                    width: '100%', padding: '8px 28px 8px 10px',
                                                    borderRadius: '8px', border: '1px solid rgba(255,255,255,0.12)',
                                                    background: 'rgba(255,255,255,0.05)', color: 'var(--text-primary, #fff)',
                                                    fontSize: '0.8rem', appearance: 'none', cursor: 'pointer',
                                                }}
                                            >
                                                {sorted.map(m => (
                                                    <option key={m.id} value={m.id} style={{ background: '#1e293b' }}>
                                                        {formatDate(m.date)} — {m.weight}kg
                                                    </option>
                                                ))}
                                            </select>
                                            <ChevronDown size={14} style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', color: '#64748b', pointerEvents: 'none' }} />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Info box */}
                        <div style={{
                            padding: '10px 14px', borderRadius: '10px',
                            background: 'rgba(124,58,237,0.08)', border: '1px solid rgba(124,58,237,0.2)',
                            marginBottom: '1.5rem', fontSize: '0.78rem', color: 'var(--text-secondary, #94a3b8)',
                            lineHeight: 1.5,
                        }}>
                            <strong style={{ color: '#a78bfa' }}>O PDF vai incluir:</strong><br />
                            Dados do atleta • Métricas principais • {mode === 'compare' ? 'Tabela comparativa com variações • ' : ''}Gráficos de evolução • Dobras cutâneas • Perimetria • Interpretação automática
                        </div>

                        {/* Generate Button */}
                        <button
                            id="btn-generate-pdf-confirm"
                            onClick={handleGenerate}
                            disabled={loading || done}
                            style={{
                                width: '100%', padding: '13px', borderRadius: '12px',
                                border: 'none', cursor: loading || done ? 'not-allowed' : 'pointer',
                                background: done ? 'linear-gradient(135deg, #16a34a, #22c55e)' : 'linear-gradient(135deg, #7c3aed, #a855f7)',
                                color: '#fff', fontWeight: 700, fontSize: '0.95rem',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
                                boxShadow: done ? '0 4px 15px rgba(22,163,74,0.4)' : '0 4px 15px rgba(124,58,237,0.4)',
                                transition: 'all 0.3s',
                            }}
                        >
                            {done ? (
                                <><CheckCircle size={20} /> PDF baixado com sucesso!</>
                            ) : loading ? (
                                <><Loader2 size={20} style={{ animation: 'spin 1s linear infinite' }} /> Gerando PDF...</>
                            ) : (
                                <><FileDown size={20} /> Gerar & Baixar PDF</>
                            )}
                        </button>

                        <style>{`
                            @keyframes slideUp {
                                from { opacity: 0; transform: translateY(20px); }
                                to { opacity: 1; transform: translateY(0); }
                            }
                            @keyframes spin {
                                from { transform: rotate(0deg); }
                                to { transform: rotate(360deg); }
                            }
                        `}</style>
                    </div>
                </div>
            )}
        </>
    );
};

export default BodyMetricsPDFExport;

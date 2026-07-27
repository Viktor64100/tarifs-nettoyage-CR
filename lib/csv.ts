import type { ImportRow } from "@/app/(app)/prospects/actions";

function detectDelimiter(text: string): string {
  const firstLine = text.split(/\r?\n/).find((l) => l.trim().length) ?? "";
  const tabs = (firstLine.match(/\t/g) || []).length;
  const commas = (firstLine.match(/,/g) || []).length;
  const semicolons = (firstLine.match(/;/g) || []).length;
  if (tabs > commas && tabs > semicolons) return "\t";
  if (semicolons > commas) return ";";
  return ",";
}

// Parseur CSV minimal : gère guillemets, virgules/tabulations/points-virgules
// échappées à l'intérieur des champs, et guillemets doublés ("").
function parseDelimited(text: string, delimiter: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += c;
      }
    } else if (c === '"') {
      inQuotes = true;
    } else if (c === delimiter) {
      row.push(field);
      field = "";
    } else if (c === "\n") {
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else if (c === "\r") {
      // ignoré, \n gère le retour à la ligne
    } else {
      field += c;
    }
  }
  if (field.length || row.length) {
    row.push(field);
    rows.push(row);
  }
  return rows.filter((r) => r.some((c) => c.trim().length));
}

export function parseCSV(text: string): string[][] {
  return parseDelimited(text, detectDelimiter(text));
}

const HEADER_ALIASES: Record<string, keyof ImportRow> = {
  prenom: "first_name",
  firstname: "first_name",
  first_name: "first_name",
  nom: "last_name",
  lastname: "last_name",
  last_name: "last_name",
  entreprise: "company",
  societe: "company",
  company: "company",
  telephone: "phone",
  tel: "phone",
  phone: "phone",
  email: "email",
  mail: "email",
  courriel: "email",
  secteur: "sector",
  sector: "sector",
};

function normalizeHeader(h: string): string {
  return h
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

export function mapRowsToProspects(rows: string[][]) {
  if (!rows.length) return { imported: [] as ImportRow[], skippedCount: 0, usedHeader: false };

  const mappedHeader = rows[0].map((h) => HEADER_ALIASES[normalizeHeader(h)]);
  const recognizedCount = mappedHeader.filter(Boolean).length;
  const usedHeader = recognizedCount >= 2;

  const columnMap: (keyof ImportRow | undefined)[] = usedHeader
    ? mappedHeader
    : ["first_name", "last_name", "company", "phone", "email", "sector"];
  const dataRows = usedHeader ? rows.slice(1) : rows;

  const imported: ImportRow[] = [];
  let skippedCount = 0;

  for (const r of dataRows) {
    const obj: Partial<ImportRow> = {};
    columnMap.forEach((field, idx) => {
      if (!field) return;
      const val = (r[idx] ?? "").trim();
      if (val) obj[field] = val;
    });
    if (obj.first_name && obj.phone) {
      imported.push(obj as ImportRow);
    } else {
      skippedCount++;
    }
  }

  return { imported, skippedCount, usedHeader };
}

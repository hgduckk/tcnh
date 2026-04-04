import { NextResponse } from "next/server";
import { assertAdminRequest } from "@/lib/adminAuth";
import { readFile } from "fs/promises";
import path from "path";

type SchemaField = {
  name: string;
  type: string;
  isPrimary: boolean;
  isForeign: boolean;
};

type SchemaTable = {
  name: string;
  fields: SchemaField[];
};

type SchemaEdge = {
  fromTable: string;
  fromColumn: string;
  toTable: string;
  toColumn: string;
};

function parseSchema(sql: string): { tables: SchemaTable[]; edges: SchemaEdge[] } {
  const tableRegex = /CREATE TABLE(?: IF NOT EXISTS)?\s+([a-zA-Z_][\w]*)\s*\(([^]*?)\);/gi;

  const tables: SchemaTable[] = [];
  const edges: SchemaEdge[] = [];
  const fieldRefMap = new Map<string, string>();

  let match: RegExpExecArray | null;
  while ((match = tableRegex.exec(sql)) !== null) {
    const tableName = match[1];
    const body = match[2] || "";
    const lines = body.split("\n");

    const fields: SchemaField[] = [];

    for (const rawLine of lines) {
      const trimmed = rawLine.trim();
      if (!trimmed || trimmed.startsWith("--")) continue;

      const line = trimmed.replace(/,$/, "");
      const upper = line.toUpperCase();
      if (
        upper.startsWith("CONSTRAINT ") ||
        upper.startsWith("PRIMARY KEY") ||
        upper.startsWith("FOREIGN KEY") ||
        upper.startsWith("UNIQUE ") ||
        upper.startsWith("CHECK ")
      ) {
        continue;
      }

      const colMatch = line.match(/^"?([a-zA-Z_][\w]*)"?\s+(.+)$/);
      if (!colMatch) continue;

      const colName = colMatch[1];
      const rest = colMatch[2];
      const restUpper = rest.toUpperCase();

      const type = rest
        .replace(/DEFAULT\s+[^,]+/gi, "")
        .replace(/NOT NULL/gi, "")
        .replace(/NULL/gi, "")
        .replace(/REFERENCES\s+[a-zA-Z_][\w]*\s*\([^)]*\)/gi, "")
        .replace(/CHECK\s*\([^)]*\)/gi, "")
        .trim()
        .split(/\s+/)
        .slice(0, 3)
        .join(" ")
        .trim();

      const isPrimary = restUpper.includes("PRIMARY KEY");

      let isForeign = false;
      const refMatch = rest.match(/REFERENCES\s+([a-zA-Z_][\w]*)\s*\(([^)]+)\)/i);
      if (refMatch) {
        isForeign = true;
        const toTable = refMatch[1];
        const toColumn = refMatch[2].trim();
        edges.push({
          fromTable: tableName,
          fromColumn: colName,
          toTable,
          toColumn,
        });
        fieldRefMap.set(`${tableName}.${colName}`, `${toTable}.${toColumn}`);
      }

      fields.push({
        name: colName,
        type: type || "TEXT",
        isPrimary,
        isForeign,
      });
    }

    // Parse table-level foreign keys if any.
    const fkRegex = /FOREIGN KEY\s*\(([^)]+)\)\s*REFERENCES\s+([a-zA-Z_][\w]*)\s*\(([^)]+)\)/gi;
    let fkMatch: RegExpExecArray | null;
    while ((fkMatch = fkRegex.exec(body)) !== null) {
      const fromColumn = fkMatch[1].trim();
      const toTable = fkMatch[2].trim();
      const toColumn = fkMatch[3].trim();

      edges.push({
        fromTable: tableName,
        fromColumn,
        toTable,
        toColumn,
      });

      const targetField = fields.find((f) => f.name === fromColumn);
      if (targetField) targetField.isForeign = true;
      fieldRefMap.set(`${tableName}.${fromColumn}`, `${toTable}.${toColumn}`);
    }

    tables.push({ name: tableName, fields });
  }

  const edgeUnique = new Map<string, SchemaEdge>();
  for (const e of edges) {
    const key = `${e.fromTable}.${e.fromColumn}->${e.toTable}.${e.toColumn}`;
    if (!edgeUnique.has(key)) edgeUnique.set(key, e);
  }

  return {
    tables,
    edges: Array.from(edgeUnique.values()),
  };
}

export async function GET(request: Request) {
  const authError = assertAdminRequest(request);
  if (authError) return authError;

  try {
    const schemaPath = path.join(process.cwd(), "supabase-schema.sql");
    const sql = await readFile(schemaPath, "utf-8");

    const parsed = parseSchema(sql);

    return NextResponse.json({ success: true, data: parsed }, {
      headers: {
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: `Failed to parse schema: ${String(error)}` },
      { status: 500 }
    );
  }
}

import fs from 'fs';
import path from 'path';
import { NextResponse } from 'next/server';

const VISITS_FILENAME = 'admin-visits.json';

const getVisitsPath = () => path.join(process.cwd(), VISITS_FILENAME);

async function readVisits() {
  const filePath = getVisitsPath();
  try {
    const json = await fs.promises.readFile(filePath, 'utf8');
    return JSON.parse(json);
  } catch (error) {
    if ((error as any).code === 'ENOENT') {
      const initial = { visits: 0, lastUpdated: new Date().toISOString() };
      await fs.promises.writeFile(filePath, JSON.stringify(initial, null, 2), 'utf8');
      return initial;
    }
    throw error;
  }
}

async function writeVisits(data: any) {
  const filePath = getVisitsPath();
  await fs.promises.writeFile(filePath, JSON.stringify(data, null, 2), 'utf8');
}

export async function GET() {
  const data = await readVisits();
  return NextResponse.json(data);
}

export async function POST() {
  const data = await readVisits();
  data.visits = (data.visits || 0) + 1;
  data.lastUpdated = new Date().toISOString();
  await writeVisits(data);
  return NextResponse.json(data);
}

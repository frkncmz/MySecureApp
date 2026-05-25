import { getDatabase } from './db';
import * as Crypto from 'expo-crypto';

export interface DateEntry {
  id: string;
  flirt_id: string;
  date: string;
  location: string | null;
  notes: string | null;
  score: number | null;
  is_rated: number;
  created_at: string;
}

export interface DateWithFlirt extends DateEntry {
  flirt_name: string;
  flirt_photo: string | null;
}

export async function createDate(data: { flirt_id: string; date: string; location?: string; notes?: string }): Promise<string> {
  const db = await getDatabase();
  const id = Crypto.randomUUID();

  await db.runAsync(
    'INSERT INTO dates (id, flirt_id, date, location, notes) VALUES (?, ?, ?, ?, ?)',
    [id, data.flirt_id, data.date, data.location ?? null, data.notes ?? null]
  );

  return id;
}

export async function getDateById(id: string): Promise<DateEntry | null> {
  const db = await getDatabase();
  return db.getFirstAsync<DateEntry>('SELECT * FROM dates WHERE id = ?', [id]);
}

export async function getDatesForFlirt(flirtId: string): Promise<DateEntry[]> {
  const db = await getDatabase();
  return db.getAllAsync<DateEntry>(
    'SELECT * FROM dates WHERE flirt_id = ? ORDER BY date DESC',
    [flirtId]
  );
}

export async function getAllDates(): Promise<DateWithFlirt[]> {
  const db = await getDatabase();
  return db.getAllAsync<DateWithFlirt>(
    `SELECT d.*, f.name as flirt_name, f.photo_uri as flirt_photo 
     FROM dates d 
     JOIN flirts f ON d.flirt_id = f.id 
     ORDER BY d.date DESC`
  );
}

export async function getUpcomingDates(limit: number = 5): Promise<DateWithFlirt[]> {
  const db = await getDatabase();
  const today = new Date().toISOString().split('T')[0];
  return db.getAllAsync<DateWithFlirt>(
    `SELECT d.*, f.name as flirt_name, f.photo_uri as flirt_photo
     FROM dates d
     JOIN flirts f ON d.flirt_id = f.id
     WHERE d.date >= ?
     ORDER BY d.date ASC
     LIMIT ?`,
    [today, limit]
  );
}

export async function getUnratedDates(): Promise<DateWithFlirt[]> {
  const db = await getDatabase();
  const today = new Date().toISOString().split('T')[0];
  return db.getAllAsync<DateWithFlirt>(
    `SELECT d.*, f.name as flirt_name, f.photo_uri as flirt_photo
     FROM dates d
     JOIN flirts f ON d.flirt_id = f.id
     WHERE d.is_rated = 0 AND d.date < ?
     ORDER BY d.date DESC`,
    [today]
  );
}

export async function getDatesForDay(dayString: string): Promise<DateWithFlirt[]> {
  const db = await getDatabase();
  return db.getAllAsync<DateWithFlirt>(
    `SELECT d.*, f.name as flirt_name, f.photo_uri as flirt_photo
     FROM dates d
     JOIN flirts f ON d.flirt_id = f.id
     WHERE d.date LIKE ?
     ORDER BY d.date ASC`,
    [`${dayString}%`]
  );
}

export async function getDateMarkers(): Promise<Record<string, { marked: boolean; dotColor: string }>> {
  const db = await getDatabase();
  const dates = await db.getAllAsync<{ date: string; is_rated: number }>('SELECT date, is_rated FROM dates');
  
  const markers: Record<string, { marked: boolean; dotColor: string }> = {};
  for (const d of dates) {
    const day = d.date.split('T')[0];
    markers[day] = { marked: true, dotColor: d.is_rated ? '#34D399' : '#FF4B5C' };
  }
  return markers;
}

export async function markDateRated(dateId: string, score: number): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    'UPDATE dates SET is_rated = 1, score = ? WHERE id = ?',
    [score, dateId]
  );
}

export async function updateDate(id: string, data: { date?: string; location?: string; notes?: string }): Promise<void> {
  const db = await getDatabase();
  const fields = Object.keys(data).filter(k => (data as any)[k] !== undefined);
  if (fields.length === 0) return;

  const setClause = fields.map(f => `${f} = ?`).join(', ');
  const values = fields.map(k => (data as any)[k]);
  await db.runAsync(`UPDATE dates SET ${setClause} WHERE id = ?`, [...values, id]);
}

export async function deleteDate(id: string): Promise<void> {
  const db = await getDatabase();
  await db.runAsync('DELETE FROM dates WHERE id = ?', [id]);
}

export async function getDatesCount(): Promise<number> {
  const db = await getDatabase();
  const result = await db.getFirstAsync<{ count: number }>('SELECT COUNT(*) as count FROM dates');
  return result?.count ?? 0;
}

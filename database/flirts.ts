import { getDatabase } from './db';
import * as Crypto from 'expo-crypto';

export interface Flirt {
  id: string;
  name: string;
  photo_uri: string | null;
  met_date: string | null;
  met_place: string | null;
  age: number | null;
  zodiac: string | null;
  height: string | null;
  body_type: string | null;
  hair_color: string | null;
  eye_color: string | null;
  instagram: string | null;
  tiktok: string | null;
  snapchat: string | null;
  phone: string | null;
  interests: string | null; // JSON array
  status: string;
  notes: string | null;
  score: number;
  total_ratings: number;
  created_at: string;
  updated_at: string;
}

export interface Trait {
  id: string;
  flirt_id: string;
  type: 'pro' | 'con';
  label: string;
  is_custom: number;
}

export interface PresetTag {
  id: string;
  type: 'pro' | 'con';
  label: string;
}

export async function createFlirt(data: Omit<Flirt, 'id' | 'status' | 'score' | 'total_ratings' | 'created_at' | 'updated_at'>): Promise<string> {
  const db = await getDatabase();
  const id = Crypto.randomUUID();

  await db.runAsync(
    `INSERT INTO flirts (id, name, photo_uri, met_date, met_place, age, zodiac, height, body_type, hair_color, eye_color, instagram, tiktok, snapchat, phone, interests, notes)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [id, data.name, data.photo_uri, data.met_date, data.met_place, data.age, data.zodiac, data.height, data.body_type, data.hair_color, data.eye_color, data.instagram, data.tiktok, data.snapchat, data.phone, data.interests, data.notes]
  );

  return id;
}

export async function getFlirtById(id: string): Promise<Flirt | null> {
  const db = await getDatabase();
  return db.getFirstAsync<Flirt>('SELECT * FROM flirts WHERE id = ?', [id]);
}

export async function getAllFlirts(): Promise<Flirt[]> {
  const db = await getDatabase();
  return db.getAllAsync<Flirt>('SELECT * FROM flirts WHERE status = ? ORDER BY created_at DESC', ['active']);
}

export async function getFlirtsSorted(sortBy: string, filter?: string): Promise<Flirt[]> {
  const db = await getDatabase();
  const status = filter === 'archived' ? 'archived' : 'active';

  let orderClause = 'created_at DESC';
  switch (sortBy) {
    case 'name': orderClause = 'name ASC'; break;
    case 'score': orderClause = 'score DESC'; break;
    case 'date': orderClause = 'met_date DESC'; break;
  }

  return db.getAllAsync<Flirt>(`SELECT * FROM flirts WHERE status = ? ORDER BY ${orderClause}`, [status]);
}

export async function searchFlirts(query: string): Promise<Flirt[]> {
  const db = await getDatabase();
  const q = `%${query}%`;
  return db.getAllAsync<Flirt>(
    'SELECT * FROM flirts WHERE status = ? AND (name LIKE ? OR notes LIKE ?) ORDER BY name ASC',
    ['active', q, q]
  );
}

export async function updateFlirt(id: string, data: Partial<Omit<Flirt, 'id' | 'created_at'>>): Promise<void> {
  const db = await getDatabase();
  const fields = Object.keys(data).filter(k => k !== 'id' && k !== 'created_at');
  const values = fields.map(k => (data as any)[k]);

  if (fields.length === 0) return;

  const setClause = fields.map(f => `${f} = ?`).join(', ');
  await db.runAsync(
    `UPDATE flirts SET ${setClause}, updated_at = datetime('now') WHERE id = ?`,
    [...values, id]
  );
}

export async function archiveFlirt(id: string): Promise<void> {
  await updateFlirt(id, { status: 'archived' });
}

export async function unarchiveFlirt(id: string): Promise<void> {
  await updateFlirt(id, { status: 'active' });
}

export async function deleteFlirt(id: string): Promise<void> {
  const db = await getDatabase();
  await db.runAsync('DELETE FROM flirts WHERE id = ?', [id]);
}

export async function updateFlirtScore(id: string, newScore: number): Promise<void> {
  const db = await getDatabase();
  const flirt = await getFlirtById(id);
  if (!flirt) return;

  let updatedScore: number;
  let updatedRatings: number;

  if (flirt.total_ratings === 0) {
    updatedScore = newScore;
    updatedRatings = 1;
  } else {
    updatedScore = (flirt.score * flirt.total_ratings + newScore) / (flirt.total_ratings + 1);
    updatedScore = Math.round(updatedScore * 10) / 10;
    updatedRatings = flirt.total_ratings + 1;
  }

  await db.runAsync(
    'UPDATE flirts SET score = ?, total_ratings = ?, updated_at = datetime(\'now\') WHERE id = ?',
    [updatedScore, updatedRatings, id]
  );
}

export async function getFlirtsCount(): Promise<number> {
  const db = await getDatabase();
  const result = await db.getFirstAsync<{ count: number }>('SELECT COUNT(*) as count FROM flirts WHERE status = ?', ['active']);
  return result?.count ?? 0;
}

export async function getAverageFlirtScore(): Promise<number> {
  const db = await getDatabase();
  const result = await db.getFirstAsync<{ avg: number }>('SELECT AVG(score) as avg FROM flirts WHERE status = ? AND total_ratings > 0', ['active']);
  return result?.avg ? Math.round(result.avg * 10) / 10 : 0;
}

export async function getTopRatedFlirts(limit: number = 5): Promise<Flirt[]> {
  const db = await getDatabase();
  return db.getAllAsync<Flirt>(
    'SELECT * FROM flirts WHERE status = ? AND total_ratings > 0 ORDER BY score DESC LIMIT ?',
    ['active', limit]
  );
}

// Traits
export async function addTrait(flirtId: string, type: 'pro' | 'con', label: string, isCustom: boolean = false): Promise<void> {
  const db = await getDatabase();
  const id = Crypto.randomUUID();
  await db.runAsync(
    'INSERT INTO traits (id, flirt_id, type, label, is_custom) VALUES (?, ?, ?, ?, ?)',
    [id, flirtId, type, label, isCustom ? 1 : 0]
  );
}

export async function getTraits(flirtId: string): Promise<Trait[]> {
  const db = await getDatabase();
  return db.getAllAsync<Trait>('SELECT * FROM traits WHERE flirt_id = ?', [flirtId]);
}

export async function deleteTrait(id: string): Promise<void> {
  const db = await getDatabase();
  await db.runAsync('DELETE FROM traits WHERE id = ?', [id]);
}

export async function getPresetTags(): Promise<PresetTag[]> {
  const db = await getDatabase();
  return db.getAllAsync<PresetTag>('SELECT * FROM preset_tags ORDER BY type, label');
}

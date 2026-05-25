import { getDatabase, closeDatabase } from './db';
import { Paths, File as ExpoFile } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';
import * as SQLite from 'expo-sqlite';

const TABLES = [
  'flirts',
  'traits',
  'dates',
  'questions',
  'answers',
  'preset_tags',
];

// Simple XOR-based encryption using PIN as key
function deriveKey(pin: string): number[] {
  const hash: number[] = [];
  for (let i = 0; i < 32; i++) {
    let val = 0;
    for (let j = 0; j < pin.length; j++) {
      val = (val * 31 + pin.charCodeAt(j) + i * 7) & 0xFF;
    }
    hash.push(val);
  }
  return hash;
}

function encrypt(data: string, pin: string): string {
  const key = deriveKey(pin);
  const bytes = new TextEncoder().encode(data);
  const encrypted = new Uint8Array(bytes.length);
  for (let i = 0; i < bytes.length; i++) {
    encrypted[i] = bytes[i] ^ key[i % key.length];
  }
  let binary = '';
  encrypted.forEach(b => binary += String.fromCharCode(b));
  return btoa(binary);
}

function decrypt(base64: string, pin: string): string {
  const key = deriveKey(pin);
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  const decrypted = new Uint8Array(bytes.length);
  for (let i = 0; i < bytes.length; i++) {
    decrypted[i] = bytes[i] ^ key[i % key.length];
  }
  return new TextDecoder().decode(decrypted);
}

export async function exportData(pin: string): Promise<void> {
  const db = await getDatabase();
  const backup: Record<string, any[]> = {};

  for (const table of TABLES) {
    try {
      const rows = await db.getAllAsync(`SELECT * FROM ${table}`);

      // Strip photo URIs from flirts (profile photos not backed up)
      if (table === 'flirts') {
        (rows as any[]).forEach(row => { row.photo_uri = null; });
      }

      backup[table] = rows as any[];
    } catch {
      backup[table] = [];
    }
  }

  const jsonData = JSON.stringify({
    version: '1.0.0',
    app: 'LoveLog',
    exportedAt: new Date().toISOString(),
    data: backup,
  });

  const encrypted = encrypt(jsonData, pin);

  const fileName = `LoveLog_Backup_${new Date().toISOString().split('T')[0]}.lovelog`;
  const file = new ExpoFile(Paths.cache, fileName);
  file.write(encrypted);

  await Sharing.shareAsync(file.uri, {
    mimeType: 'application/octet-stream',
    dialogTitle: 'Save LoveLog Backup',
    UTI: 'public.data',
  });
}

export async function importData(pin: string): Promise<{ success: boolean; error?: string }> {
  const result = await DocumentPicker.getDocumentAsync({
    type: '*/*',
    copyToCacheDirectory: true,
  });

  if (result.canceled || !result.assets?.length) {
    return { success: false, error: 'No file selected' };
  }

  const fileUri = result.assets[0].uri;

  try {
    const importFile = new ExpoFile(fileUri);
    const encrypted = await importFile.text();

    let jsonData: string;
    try {
      jsonData = decrypt(encrypted, pin);
    } catch {
      return { success: false, error: 'Wrong PIN or corrupted file.' };
    }

    let parsed: any;
    try {
      parsed = JSON.parse(jsonData);
    } catch {
      return { success: false, error: 'Wrong PIN or corrupted file.' };
    }

    if (!parsed?.app || parsed.app !== 'LoveLog' || !parsed?.data) {
      return { success: false, error: 'Wrong PIN or invalid backup file.' };
    }

    // Close current DB connection
    await closeDatabase();

    // Delete existing DB
    try {
      await SQLite.deleteDatabaseAsync('lovelog.db');
    } catch {
      // Ignore
    }

    // Re-open fresh DB (this will re-create all tables)
    const db = await getDatabase();

    // Disable foreign keys temporarily for import
    await db.execAsync('PRAGMA foreign_keys = OFF;');

    // Import data table by table in correct order
    const importOrder = [
      'flirts',
      'traits',
      'dates',
      'questions',
      'answers',
      'preset_tags',
    ];

    for (const table of importOrder) {
      const rows = parsed.data[table];
      if (!rows || !Array.isArray(rows) || rows.length === 0) continue;

      for (const row of rows) {
        const columns = Object.keys(row);
        const placeholders = columns.map(() => '?').join(', ');
        const values = columns.map(col => row[col]);

        try {
          await db.runAsync(
            `INSERT OR REPLACE INTO ${table} (${columns.join(', ')}) VALUES (${placeholders})`,
            values
          );
        } catch (e) {
          console.warn(`Import warning for ${table}:`, e);
        }
      }
    }

    // Re-enable foreign keys
    await db.execAsync('PRAGMA foreign_keys = ON;');

    return { success: true };
  } catch (e) {
    console.error('Import error:', e);
    return { success: false, error: 'Failed to import backup file.' };
  }
}

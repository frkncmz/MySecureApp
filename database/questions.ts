import { getDatabase } from './db';
import * as Crypto from 'expo-crypto';

export interface Question {
  id: string;
  context: 'date' | 'flirt_initial';
  question_text: string;
  options: string; // JSON array
  sort_order: number;
  is_active: number;
}

export interface Answer {
  id: string;
  question_id: string;
  reference_id: string;
  reference_type: 'date' | 'flirt';
  selected_option: string;
  sentiment: 'good' | 'neutral' | 'bad';
  created_at: string;
}

export async function getQuestionsByContext(context: 'date' | 'flirt_initial'): Promise<Question[]> {
  const db = await getDatabase();
  return db.getAllAsync<Question>(
    'SELECT * FROM questions WHERE context = ? AND is_active = 1 ORDER BY sort_order ASC',
    [context]
  );
}

export async function saveAnswer(data: {
  questionId: string;
  referenceId: string;
  referenceType: 'date' | 'flirt';
  selectedOption: string;
  sentiment: 'good' | 'neutral' | 'bad';
}): Promise<void> {
  const db = await getDatabase();
  const id = Crypto.randomUUID();

  await db.runAsync(
    'INSERT INTO answers (id, question_id, reference_id, reference_type, selected_option, sentiment) VALUES (?, ?, ?, ?, ?, ?)',
    [id, data.questionId, data.referenceId, data.referenceType, data.selectedOption, data.sentiment]
  );
}

export async function saveAllAnswers(answers: Array<{
  questionId: string;
  referenceId: string;
  referenceType: 'date' | 'flirt';
  selectedOption: string;
  sentiment: 'good' | 'neutral' | 'bad';
}>): Promise<void> {
  for (const answer of answers) {
    await saveAnswer(answer);
  }
}

export async function getAnswersForReference(referenceId: string, referenceType: 'date' | 'flirt'): Promise<(Answer & { question_text: string })[]> {
  const db = await getDatabase();
  return db.getAllAsync<Answer & { question_text: string }>(
    `SELECT a.*, q.question_text 
     FROM answers a 
     JOIN questions q ON a.question_id = q.id 
     WHERE a.reference_id = ? AND a.reference_type = ?
     ORDER BY q.sort_order ASC`,
    [referenceId, referenceType]
  );
}

export async function deleteAnswersForReference(referenceId: string, referenceType: 'date' | 'flirt'): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    'DELETE FROM answers WHERE reference_id = ? AND reference_type = ?',
    [referenceId, referenceType]
  );
}

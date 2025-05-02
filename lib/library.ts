import { db, Word } from './db';

export async function getLibrary(): Promise<Word[]> {
  return await db.words.toArray();
}

export async function setLibrary(words: Word[]): Promise<void> {
  await db.words.clear();
  await db.words.bulkAdd(words);
} 
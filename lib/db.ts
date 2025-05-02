import Dexie, { Table } from 'dexie';

export interface FollowUp {
  question: string;
  answer: string;
}

export interface Word {
  id?: number;
  word: string;
  meaning: string;
  language: 'en' | 'de';
  queryType?: 'definition' | 'check' | 'ask';
  createdAt: Date;
  followUpHistory?: FollowUp[];
}

export interface PointsRecord {
  id?: number;
  points: number;
  timestamp: number;
  taskId: string;
  taskType: string;
}

export class SnapWortDB extends Dexie {
  words!: Table<Word>;
  points!: Dexie.Table<PointsRecord, number>;

  constructor() {
    super('snapwort');
    this.version(1).stores({
      words: '++id, word, language, createdAt',
      points: '++id, points, timestamp, taskId, taskType'
    });
    
    this.version(2).stores({
      words: '++id, word, language, createdAt, queryType'
    });
  }

  async addPoints(record: Omit<PointsRecord, 'id'>) {
    const id = await this.points.add(record);
    // Dispatch custom event when points are added
    window.dispatchEvent(new CustomEvent('pointsAdded', { 
      detail: { ...record, id }
    }));
    return id;
  }
}

export const db = new SnapWortDB(); 
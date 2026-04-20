import { openDB as idbOpenDB, type IDBPDatabase } from 'idb';
import type { WeekPlan, DayTemplate } from '@/types';

const DB_NAME = 'weekplan-db';
const DB_VERSION = 1;

export function openDB(): Promise<IDBPDatabase> {
  return idbOpenDB(DB_NAME, DB_VERSION, {
    upgrade(db, oldVersion) {
      // version 1 → 2: placeholder for future migrations
      if (oldVersion < 1) {
        db.createObjectStore('weekPlans', { keyPath: 'weekStart' });
        db.createObjectStore('templates', { keyPath: 'id' });
      }
    },
  });
}

export async function getWeekPlan(weekStart: string): Promise<WeekPlan | undefined> {
  const db = await openDB();
  return db.get('weekPlans', weekStart) as Promise<WeekPlan | undefined>;
}

export async function saveWeekPlan(plan: WeekPlan): Promise<void> {
  const db = await openDB();
  await db.put('weekPlans', plan);
}

export async function getAllTemplates(): Promise<DayTemplate[]> {
  const db = await openDB();
  return db.getAll('templates') as Promise<DayTemplate[]>;
}

export async function saveTemplate(t: DayTemplate): Promise<void> {
  const db = await openDB();
  await db.put('templates', t);
}

export async function deleteTemplate(id: string): Promise<void> {
  const db = await openDB();
  await db.delete('templates', id);
}

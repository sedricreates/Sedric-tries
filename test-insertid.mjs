import { drizzle } from 'drizzle-orm/mysql2';
import { detections } from './drizzle/schema.js';
import 'dotenv/config';

const db = drizzle(process.env.DATABASE_URL);

const result = await db.insert(detections).values({
  userId: 1,
  imageUrl: 'test-url',
  imageKey: 'test-key',
  status: 'pending'
});

console.log('Full result:', result);
console.log('result[0]:', result[0]);
console.log('insertId:', result[0].insertId);
console.log('insertId type:', typeof result[0].insertId);
console.log('parseInt result:', parseInt(String(result[0].insertId), 10));
0


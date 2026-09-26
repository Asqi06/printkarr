import 'dotenv/config';
import { MongoClient } from 'mongodb';
import { blankDb } from '../lib/db.js';

if (process.env.CONFIRM !== 'INIT_EMPTY_ATLAS' || !process.env.MONGODB_URI) {
  throw new Error('Set MONGODB_URI and CONFIRM=INIT_EMPTY_ATLAS to initialize a new, empty Atlas database.');
}

const client = new MongoClient(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 10000, writeConcern: { w: 'majority' } });
try {
  await client.connect();
  const state = client.db(process.env.MONGODB_DB || 'printkarr').collection('state');
  const result = await state.updateOne(
    { _id: 'main' },
    { $setOnInsert: { data: blankDb(), version: 0 } },
    { upsert: true }
  );
  if (!result.upsertedCount) throw new Error('Atlas already contains a database; refusing to overwrite it.');
  console.log('Initialized an empty Atlas database. No existing records were imported.');
} finally {
  await client.close();
}

/**
 * @deprecated Utiliser `@/lib/mongodb` (helper Mongo unique).
 * Ce module ne fait que ré-exporter pour compatibilité des imports existants.
 */

export {
  getMongoClient,
  getDatabase as getMongoDb,
  closeConnection as closeMongoConnection,
  mongoClient,
  getCollection,
  getDatabase,
  closeConnection,
} from '@/lib/mongodb';

export { default } from '@/lib/mongodb';

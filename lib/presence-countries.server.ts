/** Accès base des pays de présence — à n'importer que depuis du code serveur. */
import dbConnect, { getCollection } from '@/lib/mongodb';
import {
  DEFAULT_PRESENCE_COUNTRIES,
  type PresenceCountry,
} from '@/lib/presence-countries';
import PresenceCountryModel from '@/models/PresenceCountry';

const SEED_MARKER_ID = 'presence-countries';

interface LeanPresenceCountry {
  _id: unknown;
  iso: string;
  name: string;
  preposition: PresenceCountry['preposition'];
  status: PresenceCountry['status'];
  order?: number;
}

export function toPresenceCountry(doc: LeanPresenceCountry): PresenceCountry {
  return {
    id: String(doc._id),
    iso: doc.iso,
    name: doc.name,
    preposition: doc.preposition,
    status: doc.status,
    order: doc.order ?? 0,
  };
}

/**
 * Importe la liste par défaut une seule fois. Un marqueur en base empêche
 * de la réimporter si l'admin retire ensuite tous les pays.
 */
async function ensureSeeded(): Promise<void> {
  const markers = await getCollection('seed_markers');
  const result = await markers.updateOne(
    { _id: SEED_MARKER_ID as never },
    { $setOnInsert: { seededAt: new Date() } },
    { upsert: true },
  );
  if (result.upsertedCount === 0) return;

  const count = await PresenceCountryModel.estimatedDocumentCount();
  if (count === 0) {
    await PresenceCountryModel.insertMany(DEFAULT_PRESENCE_COUNTRIES, { ordered: false });
  }
}

export async function listPresenceCountries(): Promise<PresenceCountry[]> {
  await dbConnect();
  await ensureSeeded();
  const docs = await PresenceCountryModel.find({})
    .sort({ order: 1, name: 1 })
    .lean<LeanPresenceCountry[]>();
  return docs.map(toPresenceCountry);
}

/**
 * Implémentation MongoDB du repository devis
 */

import { mongoClient } from '@/lib/mongodb';
import { Document, ObjectId, OptionalId } from 'mongodb';
import { IQuoteRepository, Quote } from '../interfaces/IQuoteRepository';

export class MongoQuoteRepository implements IQuoteRepository {
  private readonly collectionName = 'quotes';

  private async getCollection() {
    const client = await mongoClient;
    const db = client.db();
    return db.collection(this.collectionName);
  }

  private mapToQuote(doc: Document): Quote {
    return {
      _id: doc['_id'].toString(),
      id: doc['_id'].toString(),
      type: doc['type'],
      projectType: doc['projectType'],
      area: doc['area'],
      features: doc['features'] || [],
      budget: doc['budget'],
      timeline: doc['timeline'],
      location: doc['location'],
      contact: doc['contact'],
      description: doc['description'],
      urgency: doc['urgency'],
      costEstimate: doc['costEstimate'],
      status: doc['status'] || 'PENDING',
      providerId: doc['providerId'],
      schoolId: doc['schoolId'],
      studentType: doc['studentType'],
      studentInfo: doc['studentInfo'],
      academicInfo: doc['academicInfo'],
      preferences: doc['preferences'],
      questions: doc['questions'],
      createdAt: doc['createdAt'] || new Date(),
      updatedAt: doc['updatedAt'] || new Date(),
    };
  }

  async findById(id: string): Promise<Quote | null> {
    try {
      const collection = await this.getCollection();
      const quote = await collection.findOne({ _id: new ObjectId(id) });
      return quote ? this.mapToQuote(quote) : null;
    } catch (error) {
      console.error('[MongoQuoteRepository] Error in findById:', error);
      throw error;
    }
  }

  async findAll(filters?: Record<string, any>): Promise<Quote[]> {
    try {
      const collection = await this.getCollection();
      const quotes = await collection.find(filters || {}).toArray();
      return quotes.map(q => this.mapToQuote(q));
    } catch (error) {
      console.error('[MongoQuoteRepository] Error in findAll:', error);
      throw error;
    }
  }

  async findOne(filters: Record<string, any>): Promise<Quote | null> {
    try {
      const collection = await this.getCollection();
      const quote = await collection.findOne(filters);
      return quote ? this.mapToQuote(quote) : null;
    } catch (error) {
      console.error('[MongoQuoteRepository] Error in findOne:', error);
      throw error;
    }
  }

  async create(data: Partial<Quote>): Promise<Quote> {
    try {
      const collection = await this.getCollection();
      const now = new Date();
      const quoteData: OptionalId<
        Document & { _id?: string | ObjectId | undefined }
      > = {
        ...data,
        status: data.status || 'PENDING',
        createdAt: now,
        updatedAt: now,
        ...(data._id ? { _id: new ObjectId(data._id) } : {}),
      };
      const result = await collection.insertOne(
        quoteData as OptionalId<Document>
      );
      const quote = await collection.findOne({ _id: result.insertedId });
      if (!quote) {
        throw new Error('Failed to create quote');
      }
      return this.mapToQuote(quote);
    } catch (error) {
      console.error('[MongoQuoteRepository] Error in create:', error);
      throw error;
    }
  }

  async update(id: string, data: Partial<Quote>): Promise<Quote | null> {
    try {
      const collection = await this.getCollection();
      const updateData: Partial<Quote> = {
        ...data,
        updatedAt: new Date(),
      };
      // Exclure _id, createdAt de la mise à jour
      delete updateData._id;
      delete updateData.createdAt;

      const result = await collection.findOneAndUpdate(
        { _id: new ObjectId(id) },
        { $set: updateData },
        { returnDocument: 'after' }
      );
      return result?.['value'] ? this.mapToQuote(result['value']) : null;
    } catch (error) {
      console.error('[MongoQuoteRepository] Error in update:', error);
      throw error;
    }
  }

  async delete(id: string): Promise<boolean> {
    try {
      const collection = await this.getCollection();
      const result = await collection.deleteOne({ _id: new ObjectId(id) });
      return result.deletedCount > 0;
    } catch (error) {
      console.error('[MongoQuoteRepository] Error in delete:', error);
      throw error;
    }
  }

  async count(filters?: Record<string, any>): Promise<number> {
    try {
      const collection = await this.getCollection();
      return await collection.countDocuments(filters || {});
    } catch (error) {
      console.error('[MongoQuoteRepository] Error in count:', error);
      throw error;
    }
  }

  async exists(id: string): Promise<boolean> {
    try {
      const collection = await this.getCollection();
      const count = await collection.countDocuments({ _id: new ObjectId(id) });
      return count > 0;
    } catch (error) {
      console.error('[MongoQuoteRepository] Error in exists:', error);
      throw error;
    }
  }

  async findByType(type: 'BTP' | 'EDUCATION'): Promise<Quote[]> {
    try {
      return await this.findAll({ type });
    } catch (error) {
      console.error('[MongoQuoteRepository] Error in findByType:', error);
      throw error;
    }
  }

  async findByStatus(
    status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'EXPIRED'
  ): Promise<Quote[]> {
    try {
      return await this.findAll({ status });
    } catch (error) {
      console.error('[MongoQuoteRepository] Error in findByStatus:', error);
      throw error;
    }
  }

  async findByContactEmail(email: string): Promise<Quote[]> {
    try {
      return await this.findAll({ 'contact.email': email });
    } catch (error) {
      console.error(
        '[MongoQuoteRepository] Error in findByContactEmail:',
        error
      );
      throw error;
    }
  }
}

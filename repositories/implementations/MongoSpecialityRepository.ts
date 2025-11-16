/**
 * Implémentation MongoDB du repository spécialité
 */

import { mongoClient } from '@/lib/mongodb';
import { ISpeciality } from '@/types';
import { Document, ObjectId, OptionalId } from 'mongodb';
import { ISpecialityRepository } from '../interfaces/ISpecialityRepository';

export class MongoSpecialityRepository implements ISpecialityRepository {
  private readonly collectionName = 'specialitytypes';

  private async getCollection() {
    const client = await mongoClient;
    const db = client.db();
    return db.collection(this.collectionName);
  }

  private mapToSpeciality(doc: Document): ISpeciality {
    return {
      _id: doc['_id'].toString(),
      name: doc['name'],
      description: doc['description'],
      group: doc['group'],
      isActive: doc['isActive'] ?? true,
      createdAt: doc['createdAt'] || new Date(),
      updatedAt: doc['updatedAt'] || new Date(),
    };
  }

  async findById(id: string): Promise<ISpeciality | null> {
    try {
      const collection = await this.getCollection();
      const speciality = await collection.findOne({ _id: new ObjectId(id) });
      return speciality ? this.mapToSpeciality(speciality) : null;
    } catch (error) {
      console.error('[MongoSpecialityRepository] Error in findById:', error);
      throw error;
    }
  }

  async findAll(filters?: Record<string, any>): Promise<ISpeciality[]> {
    try {
      const collection = await this.getCollection();
      const specialities = await collection.find(filters || {}).toArray();
      return specialities.map(s => this.mapToSpeciality(s));
    } catch (error) {
      console.error('[MongoSpecialityRepository] Error in findAll:', error);
      throw error;
    }
  }

  async findOne(filters: Record<string, any>): Promise<ISpeciality | null> {
    try {
      const collection = await this.getCollection();
      const speciality = await collection.findOne(filters);
      return speciality ? this.mapToSpeciality(speciality) : null;
    } catch (error) {
      console.error('[MongoSpecialityRepository] Error in findOne:', error);
      throw error;
    }
  }

  async create(data: Partial<ISpeciality>): Promise<ISpeciality> {
    try {
      const collection = await this.getCollection();
      const now = new Date();
      const specialityData: OptionalId<Document> = {
        name: data.name!,
        description: data.description!,
        group: data.group!,
        isActive: data.isActive !== undefined ? data.isActive : true,
        createdAt: now,
        updatedAt: now,
        ...(data._id ? { _id: new ObjectId(data._id) } : {}),
      };
      const result = await collection.insertOne(specialityData);
      const speciality = await collection.findOne({ _id: result.insertedId });
      if (!speciality) {
        throw new Error('Failed to create speciality');
      }
      return this.mapToSpeciality(speciality);
    } catch (error) {
      console.error('[MongoSpecialityRepository] Error in create:', error);
      throw error;
    }
  }

  async update(
    id: string,
    data: Partial<ISpeciality>
  ): Promise<ISpeciality | null> {
    try {
      const collection = await this.getCollection();
      const updateData: Partial<ISpeciality> = {
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
      return result?.['value'] ? this.mapToSpeciality(result['value']) : null;
    } catch (error) {
      console.error('[MongoSpecialityRepository] Error in update:', error);
      throw error;
    }
  }

  async delete(id: string): Promise<boolean> {
    try {
      const collection = await this.getCollection();
      const result = await collection.deleteOne({ _id: new ObjectId(id) });
      return result.deletedCount > 0;
    } catch (error) {
      console.error('[MongoSpecialityRepository] Error in delete:', error);
      throw error;
    }
  }

  async count(filters?: Record<string, any>): Promise<number> {
    try {
      const collection = await this.getCollection();
      return await collection.countDocuments(filters || {});
    } catch (error) {
      console.error('[MongoSpecialityRepository] Error in count:', error);
      throw error;
    }
  }

  async exists(id: string): Promise<boolean> {
    try {
      const collection = await this.getCollection();
      const count = await collection.countDocuments({ _id: new ObjectId(id) });
      return count > 0;
    } catch (error) {
      console.error('[MongoSpecialityRepository] Error in exists:', error);
      throw error;
    }
  }

  async findByName(name: string): Promise<ISpeciality | null> {
    try {
      return await this.findOne({ name });
    } catch (error) {
      console.error('[MongoSpecialityRepository] Error in findByName:', error);
      throw error;
    }
  }

  async findByGroup(group: string): Promise<ISpeciality[]> {
    try {
      return await this.findAll({ group });
    } catch (error) {
      console.error('[MongoSpecialityRepository] Error in findByGroup:', error);
      throw error;
    }
  }

  async findActive(): Promise<ISpeciality[]> {
    try {
      return await this.findAll({ isActive: true });
    } catch (error) {
      console.error('[MongoSpecialityRepository] Error in findActive:', error);
      throw error;
    }
  }
}

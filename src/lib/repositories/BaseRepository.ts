import { IDBPDatabase, IDBPObjectStore } from 'idb';
import { POSDatabase } from '../db';

export interface QueryOptions {
  limit?: number;
  offset?: number;
  orderBy?: 'asc' | 'desc';
}

export interface FilterCriteria {
  [key: string]: unknown;
}

export abstract class BaseRepository<T extends { id: string }> {
  protected db: IDBPDatabase<POSDatabase> | null = null;
  protected storeName: keyof POSDatabase;

  constructor(storeName: keyof POSDatabase) {
    this.storeName = storeName;
  }

  protected async getStore(mode: 'readonly' | 'readwrite' = 'readonly'): Promise<IDBPObjectStore<POSDatabase, (keyof POSDatabase)[], keyof POSDatabase>> {
    if (!this.db) {
      const { getDB } = await import('../db');
      this.db = await getDB();
    }
    return this.db.objectStore(this.storeName);
  }

  async getById(id: string): Promise<T | undefined> {
    const store = await this.getStore('readonly');
    return store.get(id) as Promise<T | undefined>;
  }

  async getAll(options?: QueryOptions): Promise<T[]> {
    const store = await this.getStore('readonly');
    const allItems = await store.getAll();
    
    let items: T[] = allItems as T[];

    if (options?.limit) {
      const offset = options.offset || 0;
      items = items.slice(offset, offset + options.limit);
    }

    return items;
  }

  async create(item: Omit<T, 'id'> & Partial<{ id: string }>): Promise<T> {
    const store = await this.getStore('readwrite');
    const newItem: T = {
      ...item,
      id: item.id || this.generateId(),
    } as T;
    
    await store.add(newItem);
    return newItem;
  }

  async update(item: T): Promise<T> {
    const store = await this.getStore('readwrite');
    await store.put(item);
    return item;
  }

  async delete(id: string): Promise<void> {
    const store = await this.getStore('readwrite');
    await store.delete(id);
  }

  async count(): Promise<number> {
    const store = await this.getStore('readonly');
    return store.count();
  }

  protected generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  protected async queryByIndex(indexName: string, value: IDBValidKey): Promise<T[]> {
    const store = await this.getStore('readonly');
    const index = store.index(indexName);
    return index.getAll(value) as Promise<T[]>;
  }

  protected async filterItems(items: T[], criteria: FilterCriteria): Promise<T[]> {
    return items.filter((item) => {
      for (const [key, value] of Object.entries(criteria)) {
        if ((item as unknown as Record<string, unknown>)[key] !== value) {
          return false;
        }
      }
      return true;
    });
  }
}

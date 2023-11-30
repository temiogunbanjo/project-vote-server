import { PrismaClient } from '@prisma/client';
import { DatasourceInterface } from "./DatasourceInterface";
import { QueryFilter } from '../types';
const prisma = new PrismaClient();

class Datasource implements DatasourceInterface {
  client: PrismaClient | null = null;

  async connect() {
    this.client = prisma;
    return prisma;
  }

  async disconnect(): Promise<void> {
    if (!this.client) {
      throw new Error('Client not initialized');
    } else {
      await this.client.$disconnect();
    }
  }

  async errorHandler(error: any): Promise<void> {
    console.error(error);
    await this.disconnect();
    process.exit(1);
  }

  async fetchAllUsers() {
    try {
      const res = await prisma?.users.findMany();
      console.log(res);
      return res;
    } catch (error) {
      await this.errorHandler(error);
    }
  }

  async fetchAllEvents(filters: QueryFilter) {
    try {
      const res = await prisma?.events.findMany({
        include: {
          categories: true,
        },
      });
      console.log(res);
      return res;
    } catch (error) {
      await this.errorHandler(error);
    }
  }
}

export { Datasource };

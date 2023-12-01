import { PrismaClient } from "@prisma/client";

import { DatasourceInterface } from "./DatasourceInterface";
import CategorySchema from "../schemas/CategorySchema";
import { GenericObject, QueryFilter } from "../types";

const prisma = new PrismaClient();

type PrismaFilterOptions = {
  where?: GenericObject;
  orderBy?: { [key: string]: string | number | boolean | Date };
};

class Datasource implements DatasourceInterface {
  client: PrismaClient | null = null;

  async connect() {
    this.client = prisma;
    return prisma;
  }

  async disconnect(): Promise<void> {
    if (!this.client) {
      throw new Error("Client not initialized");
    } else {
      await this.client.$disconnect();
    }
  }

  transformFiltersToPrismaOption(filters: QueryFilter) {
    const PRISMA_FILTER_OPTIONS: PrismaFilterOptions = {};

    const transformers: {
      [x: string]: (value: string | number | string[] | Date) => void;
    } = {
      order(value) {
        const options = (value as string[]).reduce(
          (retValue: GenericObject, keyOrderPair: string) => {
            if (keyOrderPair.includes(':')) {
              const [key, order] = keyOrderPair.split(":");
              retValue[key] = order.toLowerCase();
              return retValue;
            }

            retValue[keyOrderPair] = 'desc';
            return retValue;
          },
          {}
        );

        PRISMA_FILTER_OPTIONS.orderBy = options;
      },
    };

    Object.entries(filters).forEach(([filterKey, value]) => {
      if (filterKey in transformers) {
        transformers[filterKey](value);
      }
    });

    return PRISMA_FILTER_OPTIONS;
  }

  async errorHandler(error: any): Promise<void> {
    console.error(error);
    await this.disconnect();
    process.exit(1);
  }

  async fetchAuthUser(queryParam: string) {
    try {
      const res = await prisma?.users.findUnique({
        where: {
          id: queryParam,
        },
      });
      console.log(res);
      return res;
    } catch (error) {
      await this.errorHandler(error);
    }
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

  async fetchOneEvent(queryId: string) {
    try {
      const res = await prisma?.events.findUnique({
        where: {
          id: queryId,
        },
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

  async fetchAllEvents(filters: QueryFilter) {
    try {
      const PRISMA_FILTER_OPTIONS =
        this.transformFiltersToPrismaOption(filters);

      const res = await prisma?.events.findMany({
        include: {
          categories: true,
        },
        ...PRISMA_FILTER_OPTIONS,
      });
      console.log(res);
      return res;
    } catch (error) {
      await this.errorHandler(error);
    }
  }

  // CATEGORIES
  async createCategory(newCategory: CategorySchema) {
    try {
      const res = await prisma?.categories.create({
        data: newCategory,
      });
      console.log(res);
      return res;
    } catch (error) {
      await this.errorHandler(error);
    }
  }

  async fetchAllCategories(queryId: string | undefined, filters: QueryFilter) {
    try {
      const PRISMA_FILTER_OPTIONS =
        this.transformFiltersToPrismaOption(filters);

      const res = await prisma?.categories.findMany({
        include: {
          event: true,
        },
        ...PRISMA_FILTER_OPTIONS,
        where: {
          OR: [
            { id: queryId },
            { eventId: queryId }
          ],
          AND: {
            
          }
        },
      });
      console.log(res);
      return res;
    } catch (error) {
      await this.errorHandler(error);
    }
  }

  async fetchAllCandidates(filters: QueryFilter) {
    try {
      const res = await prisma?.candidates.findMany({
        include: {
          votes: true,
        },
      });
      console.log(res);
      return res;
    } catch (error) {
      await this.errorHandler(error);
    }
  }

  async fetchAllSchools(filters: QueryFilter) {
    try {
      const res = await prisma?.schoolNames.findMany({});
      console.log(res);
      return res;
    } catch (error) {
      await this.errorHandler(error);
    }
  }
}

export { Datasource };

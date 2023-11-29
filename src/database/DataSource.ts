import { PrismaClient } from '@prisma/client';
import { DatasourceInterface } from "./DatasourceInterface";

class Datasource implements DatasourceInterface {
  connect() {
    const prisma = new PrismaClient();
    return prisma;
  }

  async disconnect(client: PrismaClient): Promise<void> {
    await client.$disconnect();
  }
}

export { Datasource };

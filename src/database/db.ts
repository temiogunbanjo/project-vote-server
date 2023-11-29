import { Datasource } from "./DataSource";

const mongoSource = new Datasource();

class DB {
  datasource: Datasource | null;
  client: any = null;

  constructor(datasource: Datasource) {
    this.datasource = datasource;
    this.client = this.datasource.connect();
  }
}

let dbInstance: DB | undefined;

try {
  dbInstance = new DB(mongoSource);
} catch (error) {
  (async () => {
    console.error(error);
    if (dbInstance && dbInstance.client) {
      await dbInstance?.datasource?.disconnect(dbInstance.client);
    }
    process.exit(1);
  })();
}

module.exports = dbInstance;
export {}

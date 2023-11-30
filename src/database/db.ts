import { QueryFilter } from "../types";
import { Datasource } from "./DataSource";

const mongoSource = new Datasource();

class DB {
  datasource: Datasource | null;

  constructor(datasource: Datasource) {
    // datasource.connect();
    this.datasource = datasource;
  }

  async fetchAllUsers() {
    return this.datasource?.fetchAllUsers();
  }

  async fetchAllEvents(filters: QueryFilter) {
    return this.datasource?.fetchAllEvents(filters);
  }
}

module.exports = new DB(mongoSource);
export {}

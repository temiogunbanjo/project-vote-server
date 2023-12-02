import { QueryFilter } from "../types";
import { Datasource } from "./DataSource";
import CategorySchema from "../schemas/CategorySchema";
import Candidate from "../schemas/CandidateSchema";

const mongoSource = new Datasource();

class DB {
  datasource: Datasource | null;

  constructor(datasource: Datasource) {
    // datasource.connect();
    this.datasource = datasource;
  }

  // USERS
  async fetchAuthUser(queryParam: string) {
    return this.datasource?.fetchAuthUser(queryParam);
  }

  async fetchAllUsers() {
    return this.datasource?.fetchAllUsers();
  }

  // EVENTS
  async fetchOneEvent(queryId: string) {
    return this.datasource?.fetchOneEvent(queryId);
  }

  async fetchAllEvents(filters: QueryFilter) {
    return this.datasource?.fetchAllEvents(filters);
  }

  // CATEGORIES
  async createCategory(newCategory: CategorySchema) {
    return this.datasource?.createCategory(newCategory);
  }

  async fetchOneCategory(categoryId: string) {
    return this.datasource?.fetchOneCategory(categoryId);
  }

  async fetchAllCategories(queryId: string | undefined, filters: QueryFilter) {
    return this.datasource?.fetchAllCategories(queryId, filters);
  }

  // CANDIDATES
  async addCandidate(newCandidate: Candidate) {
    return this.datasource?.addCandidate(newCandidate);
  }

  async fetchAllCandidates(filters: QueryFilter) {
    return this.datasource?.fetchAllCandidates(filters);
  }

  // SCHOOLS
  async fetchAllSchools(filters: QueryFilter) {
    return this.datasource?.fetchAllSchools(filters);
  }
}

module.exports = new DB(mongoSource);
export {};

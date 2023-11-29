interface DatasourceInterface {
  connect(): any;
  disconnect(client: any): Promise<void> | void;
}

export { DatasourceInterface };

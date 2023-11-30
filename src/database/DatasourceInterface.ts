interface DatasourceInterface {
  client: any;
  connect(): any;
  disconnect(): Promise<void> | void;
  errorHandler(error: any): Promise<void>;
}

export { DatasourceInterface };

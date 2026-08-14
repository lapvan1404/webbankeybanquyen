export interface IRepository<TModel, TCreateInput, TUpdateInput> {
  findById(id: string): Promise<TModel | null>;
  findMany(options?: RepositoryQueryOptions): Promise<TModel[]>;
  create(input: TCreateInput): Promise<TModel>;
  update(id: string, input: TUpdateInput): Promise<TModel>;
  delete(id: string): Promise<TModel>;
}

export interface RepositoryQueryOptions {
  where?: Record<string, unknown>;
  orderBy?: Record<string, 'asc' | 'desc'>;
  skip?: number;
  take?: number;
  include?: Record<string, unknown>;
}

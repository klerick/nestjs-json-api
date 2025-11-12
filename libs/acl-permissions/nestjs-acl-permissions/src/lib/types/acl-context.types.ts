
/**
 * Interface for context storage (e.g., ClsService from nestjs-cls)
 * Allows passing rules and data through the request pipeline
 */
export interface AclContextStore {
  /**
   * Set value in context
   */
  set<T = any>(key: any, value: T): void;

  /**
   * Get value from context
   */
  get<T = any>(key: any): T | undefined;
}




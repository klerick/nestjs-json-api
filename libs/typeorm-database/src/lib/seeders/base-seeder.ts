import { DataSource } from 'typeorm';


export type Dictionary<T = any> = {
  [k: string]: T;
};

export abstract class BaseSeeder<T extends Dictionary = Dictionary> {
  abstract run(dataSource: DataSource, context:T): Promise<void>
  protected async call(dataSource: DataSource, seeders: {
    new (): BaseSeeder;
  }[], context?: T): Promise<void>{
    for (const seeder of seeders) {
      await new seeder().run(dataSource, context || {})
    }
  }
}

import { Factory, InstanceAttribute } from '@jorgebodega/typeorm-factory';
import { DataSource, type SaveOptions } from 'typeorm';
import type { FactorizedAttrs } from '@jorgebodega/typeorm-factory';

export abstract class BaseFactory<T extends object> extends Factory<T> {
  constructor(protected dataSource: DataSource) {
    super();
  }
  protected abstract override attrs(): FactorizedAttrs<T>;
  private eachFunction?: (entity: Partial<FactorizedAttrs<T>>) => void;

  override async make(overrideParams: Partial<FactorizedAttrs<T>> = {}) {
    const attrs = { ...this.attrs(), ...overrideParams };
    if (this.eachFunction) {
      this.eachFunction(attrs);
    }
    // @ts-ignore
    const entity = await this.makeEntity(attrs, false);
    // @ts-ignore
    await this.applyEagerInstanceAttributes(entity, attrs, false);
    // @ts-ignore
    await this.applyLazyInstanceAttributes(entity, attrs, false);
    return entity;
  }

  override async create(
    overrideParams: Partial<FactorizedAttrs<T>> = {},
    saveOptions?: SaveOptions
  ) {
    const attrs = { ...this.attrs(), ...overrideParams };
    if (this.eachFunction) {
      this.eachFunction(attrs);
    }
    const preloadedAttrs = Object.entries(attrs).filter(
      ([, value]) => !(value instanceof InstanceAttribute)
    );
    // @ts-ignore
    const entity = await this.makeEntity(
      Object.fromEntries(preloadedAttrs),
      true
    );
    // @ts-ignore
    await this.applyEagerInstanceAttributes(entity, attrs, true);
    const em = this.dataSource.createEntityManager();
    const savedEntity = await em.save(entity, saveOptions);
    // @ts-ignore
    await this.applyLazyInstanceAttributes(savedEntity, attrs, true);
    return em.save(savedEntity, saveOptions);
  }

  each(eachFunction: (entity: Partial<FactorizedAttrs<T>>) => void) {
    this.eachFunction = eachFunction;
    return this;
  }
}

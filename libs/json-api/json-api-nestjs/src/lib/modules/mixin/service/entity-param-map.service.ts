import { Inject, Injectable } from '@nestjs/common';
import { ENTITY_PARAM_MAP, CURRENT_ENTITY } from '../../../constants';
import { EntityParamMap } from '../types';
import { AnyEntity, EntityClass, EntityParam } from '../../../types';

@Injectable()
export class EntityParamMapService<
  E extends object,
  IdKey extends string = 'id'
> {
  @Inject(ENTITY_PARAM_MAP) private readonly entityParamMap!: EntityParamMap<
    EntityClass<AnyEntity>
  >;

  @Inject(CURRENT_ENTITY) private readonly currentEntity!: EntityClass<E>;

  private _entityParaMap!: EntityParam<E, IdKey>;

  getParamMap<T extends object, IdKey extends string = 'id'>(
    entity: EntityClass<T>
  ): EntityParam<T, IdKey> {
    const paramMap = this.entityParamMap.get(entity);
    if (!paramMap) throw new Error(`Param map for: ${entity.name} not found`);

    return paramMap as unknown as EntityParam<T, IdKey>;
  }

  get entityParaMap(): EntityParam<E, IdKey> {
    if (!this._entityParaMap) {
      this._entityParaMap = this.getParamMap(this.currentEntity);
    }
    return this._entityParaMap;
  }
}

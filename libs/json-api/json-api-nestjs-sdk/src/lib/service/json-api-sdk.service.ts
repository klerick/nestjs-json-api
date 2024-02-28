import { EMPTY, expand, Observable, reduce, throwError } from 'rxjs';
import { map } from 'rxjs/operators';

import {
  Entity as EntityObject,
  EntityRelation,
  EntityType,
  HttpInnerClient,
  JsonApiSdkConfig,
  QueryParams,
  QueryParamsForOneItem,
  RelationBodyData,
  ResourceObject,
  ResourceObjectRelationships,
  ReturnIfArray,
} from '../types';
import { EntityArray, getTypeForReq } from '../utils';
import { JsonApiUtilsService } from '../service';

export class JsonApiSdkService {
  constructor(
    private http: HttpInnerClient,
    private jsonApiUtilsService: JsonApiUtilsService,
    private jsonApiSdkConfig: JsonApiSdkConfig
  ) {}

  public getList<Entity>(
    entity: EntityType<Entity>,
    params?: QueryParams<Entity>
  ): Observable<EntityArray<Entity>> {
    const query = this.jsonApiUtilsService.getQueryStringParams(params);

    return this.http
      .get<Entity, 'array'>(
        this.jsonApiUtilsService.getUrlForResource(entity.name),
        {
          params: query.toObject(),
        }
      )
      .pipe(
        map<ResourceObject<Entity, 'array'>, EntityArray<Entity>>((result) => {
          const resource = params
            ? this.jsonApiUtilsService.convertResponseData(
                result,
                params.include
              )
            : this.jsonApiUtilsService.convertResponseData(result);
          const { totalItems, pageSize, pageNumber } = Object.assign(
            {
              totalItems: 0,
              pageNumber: 0,
              pageSize: 0,
            },
            result.meta
          );

          return new EntityArray<Entity>(resource, {
            totalItems,
            pageNumber,
            pageSize,
          });
        })
      );
  }

  getAll<Entity>(
    entity: EntityType<Entity>,
    params?: QueryParams<Entity>,
    push = true
  ): Observable<EntityArray<Entity>> {
    const request = this.getList(entity, params).pipe(
      expand((r) => {
        if (r.pageNumber * r.pageSize >= r.totalItems) {
          return EMPTY;
        }
        const newParams = {
          ...params,
          ...{
            page: {
              number: r.pageNumber + 1,
              size: r.pageSize,
            },
          },
        };
        return this.getList(entity, newParams);
      })
    );

    if (!push) {
      return request.pipe(
        reduce<Entity[]>((acum, item) => {
          if (!acum && !Array.isArray(acum)) {
            acum = [];
          }
          acum.push(...item);
          return acum;
        }),
        map(
          (r) =>
            new EntityArray<Entity>(r, {
              pageSize: r.length,
              pageNumber: 1,
              totalItems: r.length,
            })
        )
      );
    }

    return request;
  }

  getOne<Entity>(
    entity: EntityType<Entity>,
    id: string | number,
    params?: QueryParamsForOneItem<Entity>
  ): Observable<Entity> {
    if (!id) {
      return throwError(() => new Error('Id for resource is required'));
    }

    const query = this.jsonApiUtilsService.getQueryStringParams(params);
    return this.http
      .get<Entity>(
        `${this.jsonApiUtilsService.getUrlForResource(entity.name)}/${id}`,
        {
          params: query.toObject(),
        }
      )
      .pipe(
        map((result) =>
          this.jsonApiUtilsService.convertResponseData(result, params?.include)
        )
      );
  }

  public postOne<Entity extends EntityObject>(
    entity: Entity
  ): Observable<Entity> {
    const { attributes, relationships } =
      this.jsonApiUtilsService.generateBody(entity);
    const body = {
      data: {
        type: getTypeForReq(entity.constructor.name),
        attributes,
        ...(Object.keys(relationships).length > 0 ? { relationships } : {}),
      },
    };

    return this.http
      .post<Entity>(
        this.jsonApiUtilsService.getUrlForResource(entity.constructor.name),
        body
      )
      .pipe(map((r) => this.jsonApiUtilsService.convertResponseData(r)));
  }

  public patchOne<Entity extends EntityObject>(
    entity: Entity
  ): Observable<Entity> {
    if (!entity[this.jsonApiSdkConfig.idKey]) {
      return throwError(
        () =>
          new Error(
            'Resource params should be instance of resource with id params'
          )
      );
    }

    const { attributes, relationships } =
      this.jsonApiUtilsService.generateBody(entity);
    const body = {
      data: {
        id: entity[this.jsonApiSdkConfig.idKey].toString(),
        type: getTypeForReq(entity.constructor.name),
        attributes,
        ...(Object.keys(relationships).length > 0 ? { relationships } : {}),
      },
    };

    return this.http
      .patch<Entity>(
        `${this.jsonApiUtilsService.getUrlForResource(
          entity.constructor.name
        )}/${entity[this.jsonApiSdkConfig.idKey]}`,
        body
      )
      .pipe(map((r) => this.jsonApiUtilsService.convertResponseData(r)));
  }

  public deleteOne<Entity extends EntityObject>(
    entity: Entity
  ): Observable<void> {
    if (!entity[this.jsonApiSdkConfig.idKey]) {
      return throwError(
        () =>
          new Error(
            'Resource params should be instance of resource with id params'
          )
      );
    }

    return this.http.delete(
      `${this.jsonApiUtilsService.getUrlForResource(entity.constructor.name)}/${
        entity[this.jsonApiSdkConfig.idKey]
      }`
    );
  }

  public getRelationships<
    Entity extends EntityObject,
    Rel extends EntityRelation<Entity>
  >(
    entity: Entity,
    relationType: Rel
  ): Observable<ReturnIfArray<Entity[Rel], string>> {
    if (!entity[this.jsonApiSdkConfig.idKey]) {
      return throwError(
        () =>
          new Error(
            'Resource params should be instance of resource with id params'
          )
      );
    }

    return this.http
      .get<Entity, Rel>(
        `${this.jsonApiUtilsService.getUrlForResource(
          entity.constructor.name
        )}/${entity[this.jsonApiSdkConfig.idKey]}/relationships/${String(
          relationType
        )}`
      )
      .pipe(
        map((result) => this.jsonApiUtilsService.getResultForRelation(result))
      );
  }

  public patchRelationships<
    Entity extends EntityObject,
    Rel extends EntityRelation<Entity>
  >(
    entity: Entity,
    relationType: Rel
  ): Observable<ReturnIfArray<Entity[Rel], string>> {
    if (!entity[this.jsonApiSdkConfig.idKey]) {
      return throwError(
        () =>
          new Error(
            'Resource params should be instance of resource with id params'
          )
      );
    }

    if (entity[relationType] === undefined) {
      return throwError(
        () =>
          new Error(
            `${relationType.toString()} should not be undefined in entity`
          )
      );
    }

    const body: RelationBodyData = {
      data: this.jsonApiUtilsService.generateRelationshipsBody<
        Entity[EntityRelation<Entity>]
      >(entity[relationType]),
    };

    return this.http
      .patch<Entity, Rel>(
        `${this.jsonApiUtilsService.getUrlForResource(
          entity.constructor.name
        )}/${entity[this.jsonApiSdkConfig.idKey]}/relationships/${String(
          relationType
        )}`,
        body
      )
      .pipe(
        map((result) => this.jsonApiUtilsService.getResultForRelation(result))
      );
  }

  public postRelationships<
    Entity extends EntityObject,
    Rel extends EntityRelation<Entity>
  >(
    entity: Entity,
    relationType: Rel
  ): Observable<ReturnIfArray<Entity[Rel], string>> {
    if (!entity[this.jsonApiSdkConfig.idKey]) {
      return throwError(
        () =>
          new Error(
            'Resource params should be instance of resource with id params'
          )
      );
    }

    if (entity[relationType] === undefined) {
      return throwError(
        () =>
          new Error(
            `${relationType.toString()} should not be undefined in entity`
          )
      );
    }

    const body = {
      data: this.jsonApiUtilsService.generateRelationshipsBody<
        Entity[EntityRelation<Entity>]
      >(entity[relationType]),
    };

    return this.http
      .post<Entity, Rel>(
        `${this.jsonApiUtilsService.getUrlForResource(
          entity.constructor.name
        )}/${entity[this.jsonApiSdkConfig.idKey]}/relationships/${String(
          relationType
        )}`,
        body
      )
      .pipe(
        map((result) => this.jsonApiUtilsService.getResultForRelation(result))
      );
  }

  public deleteRelationships<
    Entity extends EntityObject,
    Rel extends EntityRelation<Entity>
  >(entity: Entity, relationType: Rel): Observable<void> {
    if (!entity[this.jsonApiSdkConfig.idKey]) {
      return throwError(
        () =>
          new Error(
            'Resource params should be instance of resource with id params'
          )
      );
    }

    if (entity[relationType] === undefined) {
      return throwError(
        () =>
          new Error(
            `${relationType.toString()} should not be undefined in entity`
          )
      );
    }

    const body = {
      data: this.jsonApiUtilsService.generateRelationshipsBody<
        Entity[EntityRelation<Entity>]
      >(entity[relationType]),
    };

    return this.http
      .delete(
        `${this.jsonApiUtilsService.getUrlForResource(
          entity.constructor.name
        )}/${entity[this.jsonApiSdkConfig.idKey]}/relationships/${String(
          relationType
        )}`,
        body
      )
      .pipe(map(() => void 0));
  }
}

import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { EntityMetadata, Equal, In, QueryBuilder, SelectQueryBuilder } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { paramCase } from 'param-case';

import { mixin } from '../../helpers/mixin';
import {
  BaseData,
  Entity,
  FilterOperand,
  Filters,
  JsonApiService,
  JsonApiTransform,
  OperandsMap,
  RepositoryMixin,
  RequestRelationshipsData,
  RequestResourceData,
  ResponseRelationshipsObject, ResponseResourceData,
  ResponseResourceObject,
  ServiceMixin,
  ServiceOptions,
  TransformMixin
} from '../../types';


export function serviceMixin(entity: Entity, transform: TransformMixin, connectionName: string): ServiceMixin {
  @Injectable()
  class MixinService implements JsonApiService {
    @InjectRepository(entity, connectionName) protected repository: RepositoryMixin;
    @Inject(transform) protected transform: JsonApiTransform;

    public async getRelationship(options: ServiceOptions<void>): Promise<ResponseRelationshipsObject> {
      const mainResourceName = paramCase(this.repository.metadata.name);
      const { relName, id } = options.route;

      const result = await this.repository
        .createQueryBuilder(mainResourceName)
        .leftJoinAndSelect(`${mainResourceName}.${relName}`, relName)
        .where({ id })
        .getOne();
      if (!result) {
        throw new NotFoundException({
          detail: `Resource '${mainResourceName}' with id '${id}' does not exist`
        });
      }

      let data;
      if(Array.isArray(result[relName])){
        data = result[relName].map(item => {
          const { id, type } = this.transform.transformData(item);
          return { id, type };
        });

      } else if (result[relName]){
        const { id, type } = this.transform.transformData(result[relName]);
        data = {id, type};

      } else {
        data = result[relName];
      }

      return {
        links: {
          self: this.transform.getRelationshipLink(mainResourceName, id.toString(), relName),
        },
        data,
      };
    }

    public async getDirectOne(options: ServiceOptions<void>): Promise<ResponseResourceObject> {
      const mainResourceName = paramCase(this.repository.metadata.name);
      const { id, relName, relId } = options.route;
      const { include } = options.query;

      const result = await this.repository
        .createQueryBuilder(mainResourceName)
        .leftJoinAndSelect(`${mainResourceName}.${relName}`, relName)
        .where({ id })
        .getOne();
      if (!result) {
        throw new NotFoundException({
          detail: `Resource '${mainResourceName}' with id '${id}' does not exist`
        });
      }

      const relationshipsObject = this.repository.metadata.relations.find(item => {
        return item.propertyPath === relName;
      });

      let relationshipsBuilder;
      if (relationshipsObject.type === this.repository.metadata.target) {
        relationshipsBuilder = this.repository.createQueryBuilder(mainResourceName)
          .where(`${mainResourceName}.id = :id`, {
            id: result[relName].id
          });

      } else {
        relationshipsBuilder = this.repository.manager
          .getRepository(relationshipsObject.type)
          .createQueryBuilder(relName);
        relationshipsBuilder.where(`${relationshipsBuilder.alias}.id = :id`, {id: relId});
      }

      relationshipsObject.inverseEntityMetadata.relations.map(relation => relation.propertyPath)
        .filter(relationName => {
          return include.find(includeItem => relationName === includeItem);
        })
        .forEach(relationName => {
          const selectRelation = `${relationshipsBuilder.alias}.${relationName}`;
          return relationshipsBuilder.leftJoinAndSelect(selectRelation, relationName);
        });

      const relationship = await relationshipsBuilder.getOne();
      if (!relationship) {
        throw new NotFoundException({
          detail: `Relation '${relationshipsObject.propertyName}' with id '${relId}' does not exist`
        });
      }

      const apiResult: ResponseResourceObject = {
        data: this.transform.transformData(relationship)
      };
      if (include.length > 0) {
        apiResult.included = this.transform.transformInclude(relationship);
      }

      return apiResult;
    }

    public async getDirectAll(options: ServiceOptions<void>): Promise<ResponseResourceObject> {
      const mainResourceName = paramCase(this.repository.metadata.name);
      const { include, sort, filter, page } = options.query;
      const { id, relName } = options.route;

      const builder = this.repository.createQueryBuilder(mainResourceName);
      builder.leftJoinAndSelect(`${mainResourceName}.${relName}`, relName);
      builder.where({ id });

      const result = await builder.getOne();
      if (!result) {
        throw new NotFoundException({
          detail: `Resource '${mainResourceName}' with id '${id}' does not exist`
        });
      }

      const relationshipsObject = this.repository.metadata.relations.find(item => {
        return item.propertyPath === relName;
      });
      let needPagination = false;
      let totalCount = 0;

      let relationshipsBuilder;
      if (relationshipsObject.type === this.repository.metadata.target) {
        relationshipsBuilder = this.repository
          .createQueryBuilder(mainResourceName)
          .where(`${mainResourceName}.id = :id`, {id: result[relName].id});

      } else {
        relationshipsBuilder = this.repository.manager
          .getRepository(relationshipsObject.type)
          .createQueryBuilder(relName);

        const resultRelationships = result[relName];
        if (Array.isArray(resultRelationships)) {
          let ids;
          if (resultRelationships.length > 0) {
            ids = resultRelationships.map(r => r.id);
            const skip = (page.number - 1) * page.size;
            builder.skip(skip).take(page.size);
          } else {
            // need if relation if empty, condition for empty result
            ids = [-1];
          }

          relationshipsBuilder.where(`${relationshipsBuilder.alias}.id IN (:...ids)`, {ids});
          const skip = (page.number - 1) * page.size;
          relationshipsBuilder.skip(skip).take(page.size);
          this.applyQueryFilters(relationshipsObject.inverseEntityMetadata, filter, relationshipsBuilder);
          totalCount = await relationshipsBuilder.getCount();
          needPagination = true;
        } else {
          const id = resultRelationships ? resultRelationships.id : [-1];
          relationshipsBuilder.where(`${relationshipsBuilder.alias}.id = :id`, {id});
        }
      }

      relationshipsObject.inverseEntityMetadata.relations.map(relation => relation.propertyPath)
        .filter(relationName => {
          return include.find(includeItem => relationName === includeItem);
        })
        .forEach(relationName => {
          const selectRelation = `${relationshipsBuilder.alias}.${relationName}`;
          return relationshipsBuilder.leftJoinAndSelect(selectRelation, relationName);
        });
      relationshipsBuilder.orderBy(sort);

      let relationResult;
      if (relationshipsObject.type === this.repository.metadata.target) {
        relationResult = await relationshipsBuilder.getOne();
      } else {
        relationResult = await relationshipsBuilder.getMany();
      }

      const apiResult: ResponseResourceObject = {
        data: Array.isArray(relationResult)
          ? relationResult.map(item => this.transform.transformData(item))
          : this.transform.transformData(relationResult)
      };
      if (include.length > 0) {
        if (Array.isArray(relationResult)) {
          const collectdData = relationResult.reduce((accum, value) => {
            accum.push(...this.transform.transformInclude(value));
            return accum;
          }, []);
          apiResult.included = this.filterUniqueIncludes(collectdData);

        } else {
          apiResult.included = this.transform.transformInclude(relationResult);
        }
      }
      if (needPagination) {
        apiResult.meta = {
          totalItems: totalCount,
          pageNumber: page.number,
          pageSize: page.size,
        };
      }

      return apiResult;
    }

    public async getOne(options: ServiceOptions<void>): Promise<ResponseResourceObject> {
      const preparedResourceName = paramCase(this.repository.metadata.name);
      const builder = this.repository.createQueryBuilder(preparedResourceName);
      const { include } = options.query;
      const { id } = options.route;

      this.repository
        .metadata
        .relations
        .map(relation => relation.propertyPath)
        .filter(relationName => {
          return include.find(includeItem => relationName === includeItem);
        })
        .forEach(relationName => {
          const selectRelation = `${preparedResourceName}.${relationName}`;
          return builder.leftJoinAndSelect(selectRelation, relationName);
        });

      builder.where({ id });

      const result = await builder.getOne();
      if (!result) {
        throw new NotFoundException({
          detail: `Resource '${preparedResourceName}' with id '${id}' does not exist`
        });
      }

      const apiResult: ResponseResourceObject = {
        data:  this.transform.transformData(result)
      };
      if (include.length > 0) {
        apiResult.included = this.transform.transformInclude(result);
      }

      return apiResult;
    }

    public async getAll(options: ServiceOptions<void>): Promise<ResponseResourceObject> {
      const preparedResourceName = paramCase(this.repository.metadata.name);
      const builder = this.repository.createQueryBuilder(preparedResourceName);
      const { include, filter, sort, page } = options.query;

      this.repository
        .metadata
        .relations
        .map(relation => relation.propertyPath)
        .filter(relationName => {
          return include.find(includeItem => relationName === includeItem);
        })
        .forEach(relationName => {
          const selectRelation = `${preparedResourceName}.${relationName}`;
          return builder.leftJoinAndSelect(selectRelation, relationName);
        });


      this.applyQueryFilters(this.repository.metadata, filter, builder);
      if (Object.keys(sort).length > 0 && include.length > 0) {
        const sortWithInclude = Object.entries(sort)
          .reduce((accum, [key, value]) => {
            accum[`${preparedResourceName}.${key}`] = value;
            return accum;
          }, {});
        builder.orderBy(sortWithInclude);

      } else {
        builder.orderBy(sort);
      }

      const count = await builder.getCount();
      const skip = (page.number - 1) * page.size;
      builder.skip(skip).take(page.size);

      const result = await builder.getMany();
      const apiResult: ResponseResourceObject = {
        meta: {
          totalItems: count,
          pageNumber: page.number,
          pageSize: page.size,
        },
        data: result.map(item => this.transform.transformData(item))
      };
      if (include.length > 0) {
        const collectdData = result.reduce((accum, item) => {
          accum.push(...this.transform.transformInclude(item));
          return accum;
        }, []);

        apiResult.included = this.filterUniqueIncludes(collectdData);
      }

      return apiResult;
    }

    public async patchOne(options: ServiceOptions<RequestResourceData>): Promise<ResponseResourceObject> {
      const preparedResourceName = paramCase(this.repository.metadata.name);
      const { attributes, relationships } = options.body;
      const { id } = options.route;

      const target = await this.repository.findOne(id);
      if (!target) {
        throw new NotFoundException({
          detail: `Resource '${preparedResourceName}' with id '${id}' does not exist`
        });
      }
      Object.entries(attributes).forEach(([key, value]) => {
        target[key] = value;
      });

      if (relationships) {
        const saveRelQueryType = [];
        const relPromise = Object.entries(relationships).map(([key, value]) => {
          const relation = this.repository.metadata.relations.find(item => {
            return item.propertyName === key;
          });
          const { target: relationTarget } = relation.inverseEntityMetadata;
          const { data } = value;

          if (data === null) {
            saveRelQueryType.push({
              type: relation.relationType,
              rel: key,
              id: null,
            });
            return null;
          }

          if (Array.isArray(data) && data.length === 0) {
            saveRelQueryType.push({
              type: relation.relationType,
              rel: key,
              id: []
            });
            return Promise.resolve([]);
          }

          if (!Array.isArray(data)) {
            const { type, id } = data;
            saveRelQueryType.push({type, rel: key, id});
            return this.repository.manager.getRepository(relationTarget)
              .findOne({
                id: Equal(id)
              });

          }

          const idsToAdd = data.map(item => item.id);
          const { type } = data.pop();
          saveRelQueryType.push({ type, rel: key, id: idsToAdd });
          return this.repository.manager.getRepository(relationTarget)
            .find({
              id: In(idsToAdd)
            });
        });

        let i = 0;
        for await (const rel of relPromise) {
          target[saveRelQueryType[i].rel] = rel;
          i += 1;
        }
      }

      const result = await this.repository.save(target);
      return {
        data: this.transform.transformData(result)
      };
    }

    public async patchRelationship(options: ServiceOptions<RequestRelationshipsData>): Promise<void> {
      const preparedResourceName = paramCase(this.repository.metadata.name);
      const { id, relName } = options.route;
      const { body } = options;

      const builder = this.repository.createQueryBuilder(preparedResourceName);
      builder.where({ id });

      const result = await builder.getOne();
      if (!result) {
        throw new NotFoundException({
          detail: `Resource '${preparedResourceName}' with id '${id}' does not exist`
        });
      }

      const relationObject = this.repository.metadata.relations.find(item => {
        return item.propertyName === relName;
      });
      const builderDeleteRelationships = this.repository
        .createQueryBuilder()
        .relation(relName)
        .of(id);

      if (['one-to-many', 'many-to-many'].includes(relationObject.relationType)) {
        const currentEntities = await builderDeleteRelationships.loadMany();
        const idsToDelete = currentEntities.map(entity => entity.id);
        const idsToAdd = body !== null ? (body as BaseData[]).map(i => i.id) : [];

        await builderDeleteRelationships.addAndRemove(idsToAdd, idsToDelete);

      } else if (body !== null) {
        const { id } = Array.isArray(body) ? body.shift() : body;
        await builderDeleteRelationships.set(id);

      } else {
        await builderDeleteRelationships.set(null);
      }
    }

    public async postOne(options: ServiceOptions<RequestResourceData>): Promise<ResponseResourceObject> {
      const target = this.repository.manager.create(
        this.repository.target,
        options.body.attributes,
      );

      if (options.body.relationships) {
        const saveRelQueryType = [];
        const relPromise = Object.entries(options.body.relationships)
          .map(([key, value]) => {
            const relation = this.repository.metadata.relations.find(item => {
              return item.propertyName === key;
            });
            const { target } = relation.inverseEntityMetadata;
            const { data } = value;

            if (!Array.isArray(data)) {
              const { type, id } = data ;
              saveRelQueryType.push({ type, id, rel: key });
              return this.repository.manager.getRepository(target)
                .findOne({
                  id: Equal(id)
                });

            }

            const idsToAdd = data.map(item => item.id);
            const { type } = data.pop();
            saveRelQueryType.push({type, rel: key, id: idsToAdd});
            return this.repository.manager.getRepository(target)
              .find({
                id: In(idsToAdd)
              });
          });

        let i = 0;
        for await (const rel of relPromise) {
          if (!rel) {
            throw new NotFoundException({
              detail: `Resource '${saveRelQueryType[i].type}' with `+
                `id '${saveRelQueryType[i].id}' does not exist`
            });
          }

          target[saveRelQueryType[i].rel] = rel;
          i += 1;
        }
      }

      const result = await this.repository.save(target);
      return {
        data: this.transform.transformData(result)
      };
    }

    public async postRelationship(options: ServiceOptions<RequestRelationshipsData>): Promise<void> {
      const preparedResourceName = paramCase(this.repository.metadata.name);
      const { id, relName } = options.route;
      const { body } = options;

      const builder = this.repository.createQueryBuilder(preparedResourceName);
      builder.where({ id });

      const result = await builder.getOne();
      if (!result) {
        throw new NotFoundException({
          detail: `Resource '${preparedResourceName}' with id '${id}' does not exist`
        });
      }

      const relations = this.repository.metadata.relations.find(item => {
        return item.propertyName === relName;
      });
      const postBuilder = this.repository.createQueryBuilder()
        .relation(relName)
        .of(id);

      if (['one-to-many', 'many-to-many'].includes(relations.relationType)) {
        await postBuilder.add((body as BaseData[]).map(i => i.id));
      } else {
        const { id } = Array.isArray(body) ? body.shift() : body;
        await postBuilder.set(id);
      }
    }

    public async deleteOne(options: ServiceOptions<void>): Promise<void> {
      const preparedResourceName = paramCase(this.repository.metadata.name);
      const { id } = options.route;

      const builder = this.repository.createQueryBuilder(preparedResourceName);
      builder.where({ id });

      const result = await builder.getOne();
      if (!result) {
        throw new NotFoundException({
          detail: `Resource '${preparedResourceName}' with id '${id}' does not exist`
        });
      }

      const deleteQueryBuild = this.repository.createQueryBuilder(preparedResourceName)
        .delete()
        .from(this.repository.target)
        .where('id = :id', { id });
      await deleteQueryBuild.execute();
    }

    public async deleteRelationship(options: ServiceOptions<RequestRelationshipsData>): Promise<void> {
      const mainResourceName = paramCase(this.repository.metadata.name);
      const { id, relName } = options.route;
      const { body } = options;

      const result = await this.repository
        .createQueryBuilder(mainResourceName)
        .where({ id })
        .getOne();

      if (!result) {
        throw new NotFoundException({
          detail: `Resource '${mainResourceName}' with id '${id}' does not exist`
        });
      }

      const relations = this.repository
        .metadata
        .relations
        .find(item => item.propertyName === relName);

      const deleteBuilder = this.repository.createQueryBuilder()
        .relation(relName)
        .of(id);
      if (['many-to-one', 'many-to-many'].includes(relations.relationType)) {
        await deleteBuilder.remove((body as BaseData[]).map(i => i.id));
      } else {
        await deleteBuilder.set(null);
      }
    }

    protected filterUniqueIncludes(data: ResponseResourceData[]): ResponseResourceData[] {
      const resourcesTypeMap = {};

      return data.reduce((accum, value) => {
        if (resourcesTypeMap[value.type]) {
          if (!resourcesTypeMap[value.type][value.id]) {
            resourcesTypeMap[value.type][value.id] = true;
            accum.push(value);
          }
        } else {
          resourcesTypeMap[value.type] = {[value.id]: true};
          accum.push(value);
        }

        return accum;
      }, []);
    }

    protected prepareExistenceFilterSubQuery(
      builder: SelectQueryBuilder<any>,
      metadata: EntityMetadata,
      fieldName: string,
      operand: string,
      expression: string,
    ): string {
      const relationProperty = fieldName.split('.')[1];
      const relation = metadata.relations.find(item => {
        return item.propertyName === relationProperty;
      });
      const subQuery = builder.subQuery();
      const {
        inverseSidePropertyPath,
        inverseEntityMetadata: {
          target,
          name,
        },
      } = relation;
      const resourceName = paramCase(name);

      switch (relation.relationType) {
        case 'many-to-many': {
          let joinTableName;
          let selectQuery;
          let onQuery;

          if (relation.isManyToManyOwner) {
            const { inverseJoinColumns, joinColumns } = relation;

            joinTableName = relation.joinTableName;
            onQuery = `${joinTableName}.${inverseJoinColumns[0].propertyPath} = ${resourceName}.id`;
            selectQuery = `${joinTableName}.${joinColumns[0].propertyName}`;

          } else {
            const { inverseJoinColumns, joinColumns } = relation.inverseRelation;

            joinTableName = relation.inverseRelation.joinTableName;
            onQuery = `${joinTableName}.${joinColumns[0].propertyPath} = ${resourceName}.id`;
            selectQuery = `${joinTableName}.${inverseJoinColumns[0].propertyName}`;
          }

          subQuery
            .select(selectQuery)
            .from(joinTableName, joinTableName)
            .leftJoin(resourceName, resourceName, onQuery)
            .where(`${selectQuery} = ${metadata.tableName}.id`);

          return `${expression} ${subQuery.getQuery()}` ;
        }

        case 'one-to-many': {
          subQuery
            .select(`${resourceName}.${inverseSidePropertyPath}`)
            .from(target, resourceName)
            .where(`${resourceName}.${inverseSidePropertyPath} = ${metadata.tableName}.id`);

          return `${expression} ${subQuery.getQuery()}` ;
        }
        default:
          return `${fieldName} ${operand === FilterOperand.ne ? 'IS NOT NULL' : 'IS NULL'}`;
      }
    }

    protected prepareFieldFilterSubQuery(
      builder: SelectQueryBuilder<any>,
      metadata: EntityMetadata,
      fieldName: string,
      operand: string,
      expression: string,
    ): string {
      const preparedResourceName = paramCase(metadata.name);
      const relationProperty = fieldName.split('.')[0];
      const relation = metadata.relations.find(item => {
        return item.propertyName === relationProperty;
      });
      const subQuery = builder.subQuery();
      const {
        inverseSidePropertyPath,
        inverseEntityMetadata: {
          target,
          name,
        },
      } = relation;
      const resourceName = paramCase(name);

      switch (relation.relationType) {
        case 'many-to-many': {
          let joinTableName;
          let selectQuery;
          let onQuery;

          if (relation.isManyToManyOwner) {
            const { inverseJoinColumns, joinColumns } = relation;

            joinTableName = relation.joinTableName;
            onQuery = `${joinTableName}.${inverseJoinColumns[0].propertyPath} = ${resourceName}.id`;
            selectQuery = `${joinTableName}.${joinColumns[0].propertyName}`;

          } else {
            const { inverseJoinColumns, joinColumns } = relation.inverseRelation;

            joinTableName = relation.inverseRelation.joinTableName;
            onQuery = `${joinTableName}.${joinColumns[0].propertyPath} = ${resourceName}.id`;
            selectQuery = `${joinTableName}.${inverseJoinColumns[0].propertyName}`;
          }

          subQuery
            .select(selectQuery)
            .from(joinTableName, joinTableName)
            .leftJoin(resourceName, resourceName, onQuery)
            .where(`${resourceName}.${fieldName.split('.')[1]} ${expression}`);

          return `${preparedResourceName}.id IN ${subQuery.getQuery()}` ;
        }
        case 'one-to-many': {
          subQuery
            .select(`${resourceName}.${inverseSidePropertyPath}`)
            .from(target, resourceName)
            .where(`${resourceName}.${fieldName.split('.')[1]} ${expression}`);

          return `${preparedResourceName}.id IN ${subQuery.getQuery()}` ;
        }

        default:
          return `${fieldName} ${expression}`;
      }
    }

    protected applyQueryFilters(
      metadata: EntityMetadata,
      filters: Filters,
      builder: QueryBuilder<any>,
    ): void {
      const preparedResourceName = paramCase(metadata.name);
      const relations = metadata.relations.map(item => item.propertyName);

      Object.entries(filters).forEach(([field, condition], i) => {
        const type = i === 0 ? 'where' : 'andWhere';
        const operand = Object.keys(condition).pop();
        const paramName = `params-${i}`;
        const value = operand === FilterOperand.like
          ? `%${condition[operand]}%`
          : condition[operand];

        const fieldName = field.split('.').length === 1
          ? `${preparedResourceName}.${field}`
          : field;

        builder[type](selectQueryBuilder => {
          let expression = OperandsMap[operand].replace('&', paramName);
          const textValue = value.toString().toLocaleLowerCase();

          if (
            fieldName.includes(preparedResourceName) &&
            relations.includes(field)
          ) {
            if (textValue === 'null') {
              switch (operand) {
                case FilterOperand.ne: {
                  expression = 'EXISTS';
                  break;
                }
                case FilterOperand.eq: {
                  expression = 'NOT EXISTS';
                  break;
                }
              }
            }

            return this.prepareExistenceFilterSubQuery(
              selectQueryBuilder,
              metadata,
              fieldName,
              operand,
              expression,
            );
          }

          if (!fieldName.includes(preparedResourceName)) {
            if (textValue === 'null') {
              switch (operand) {
                case FilterOperand.ne: {
                  expression = 'IS NOT NULL';
                  break;
                }
                case FilterOperand.eq: {
                  expression = 'IS NULL';
                  break;
                }
              }
            }

            return this.prepareFieldFilterSubQuery(
              selectQueryBuilder,
              metadata,
              fieldName,
              operand,
              expression,
            );
          }

          return `${fieldName} ${expression}`;
        }).setParameters({ [paramName]: value });
      });
    }
  }

  return mixin(MixinService);
}

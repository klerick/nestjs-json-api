import { EntityMetadata } from 'typeorm';
import { paramCase } from 'param-case';
import {
  PARAMS_RELATION_NAME,
  PARAMS_RELATION_ID,
  PARAMS_RESOURCE_ID,
  DEFAULT_QUERY_PAGE,
  DEFAULT_PAGE_SIZE,
  ReferenceObject,
  SwaggerConfig,
  OpenAPIObject,
  PathsObject,
  TagObject,
} from '../../../index';

import { MethodName, Entity } from '../../types';


export class SwaggerService {
  protected static config: SwaggerConfig = {};
  protected static entities: Entity[] = [];
  protected static paths: PathsObject = {};
  protected static tags: TagObject[] = [];
  protected static resources: any = {};

  public static otherEndpoints = {};

  public static addRouteConfig(entity: Entity, path: string, method: MethodName): void {
    const entityName = entity instanceof Function ? entity.name : entity.options.name;
    const swaggerPath = this.preparePath(path);
    const tag = this.prepareTag(entityName, method);
    this.addEntity(entity);
    this.tags.push(tag);

    const swaggerMethod = this.prepareMethodName(method);
    const swaggerConfig = {
      requestBody: this.prepareRequest(entityName, method),
      responses: this.prepareResponses(entityName, method),
      parameters: [
        ...this.prepareQueryParameters(entityName, method),
        ...this.preparePathParameters(entityName, method),
      ],
      security: [{
        authorisation: [
          'SRE.api'
        ]
      }],
      tags: [
        tag.name
      ]
    };

    if (this.paths[swaggerPath]) {
      this.paths[swaggerPath][swaggerMethod] = swaggerConfig;

    } else {
      this.paths[swaggerPath] = {
        [swaggerMethod]: swaggerConfig,
      };
    }
  }

  public static addResourceConfig(metadata: EntityMetadata): void {
    const { name, columns, relations } = metadata;

    const relationships = {};
    relations.forEach(relation => {
      if (['many-to-many', 'one-to-many'].includes(relation.relationType)) {
        relationships[relation.propertyName] = {
          type: 'object',
          properties: {
            data: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  type: {
                    type: 'string'
                  },
                  id: {
                    type: 'string',
                  },
                }
              },
            }
          }
        };
      } else {
        relationships[relation.propertyName] = {
          type: 'object',
          properties: {
            data: {
              type: 'object',
              properties: {
                type: {
                  type: 'string'
                },
                id: {
                  type: 'string',
                },
              }
            }
          }
        };
      }
    });

    const attributes = {};
    columns
      .filter(column => !column.relationMetadata)
      .filter(column => !column.isPrimary)
      .forEach(column => {
        let swaggerType = {};
        switch (column.type) {
          case 'interval':
          case 'smallint':
          case 'int': {
            swaggerType = { type: 'integer' };
            break;
          }
          case 'boolean':
          case 'bool': {
            swaggerType = { type: 'boolean' };
            break;
          }
          case 'timestamp':
          case 'time':
          case 'varchar': {
            swaggerType = { type: 'string' };
            break;
          }
          case 'enum': {
            swaggerType = {
              type: 'string',
              enum: column.enum,
            };
            break;
          }
        }

        attributes[column.propertyName] = swaggerType;
      });

    this.resources[name] = {
      parameters: {
        [PARAMS_RESOURCE_ID]: {
          name: PARAMS_RESOURCE_ID,
          required: true,
          in: 'path',
          schema: {
            type: 'integer',
          }
        },
        [PARAMS_RELATION_NAME]: {
          name: PARAMS_RELATION_NAME,
          required: true,
          in: 'path',
          schema: {
            type: 'string',
            enum: Object.keys(relationships),
          }
        },
        [PARAMS_RELATION_ID]: {
          name: PARAMS_RELATION_ID,
          required: true,
          in: 'path',
          schema: {
            type: 'integer',
          }
        },
        'filter': {
          name: 'filter',
          in: 'query',
          style: 'deepObject',
          schema: {
            type: 'object',
            example: {
              'field': {
                eq: 'value'
              },
              'relation.field': {
                like: 'value'
              }
            }
          }
        },
        'sort': {
          name: 'sort',
          in: 'query',
          schema: {
            type: 'string',
            example: '-field'
          }
        },
        'include': {
          name: 'include',
          in: 'query',
          schema: {
            type: 'array',
            items: {
              type: 'string',
              example: 'relation'
            }
          }
        },
        'page': {
          name: 'page',
          in: 'query',
          style: 'deepObject',
          schema: {
            type: 'object',
            properties: {
              number: {
                type: 'integer',
                minimum: 1,
                example: DEFAULT_QUERY_PAGE,
              },
              size: {
                type: 'integer',
                minimum: 1,
                example: DEFAULT_PAGE_SIZE,
              }
            }
          }
        }
      },
      responses: {
        deleteRelationship: {
          200: {
            description: 'Relationships deleted successfully'
          },
          422: {description: 'Unprocessable data'},
          404: {description: 'Resource not found'},
        },
        patchRelationship: {
          200: {
            description: 'Relationships updated successfully'
          },
          422: {description: 'Unprocessable data'},
          404: {description: 'Resource not found'},
        },
        postRelationship: {
          200: {
            description: 'Relationships created successfully'
          },
          422: {description: 'Unprocessable data'},
          404: {description: 'Resource not found'},
        },
        getRelationship: {
          200: {
            description: 'Relationships received successfully. Response `\'data\'` field depends on relationship type. <br />' +
              'For many-to-many relations it should contain an array.',
            content: {
              'application/json': {
                schema: {
                  oneOf: [{
                    type: 'object',
                    properties: {
                      data: {
                        type: 'object',
                        properties: {
                          type: {
                            type: 'string',
                          },
                          id: {
                            type: 'string',
                          },
                        }
                      }
                    },
                  }, {
                    type: 'object',
                    properties: {
                      data: {
                        type: 'array',
                        items: {
                          type: 'object',
                          properties: {
                            type: {
                              type: 'string',
                            },
                            id: {
                              type: 'string',
                            },
                          }
                        }
                      }
                    },
                  }]
                }
              }
            }
          },
          404: {description: 'Resource not found'},
        },
        getDirectAll: {
          200: {
            description: 'Resource relation list received successfully. Response `\'data\'` field depends on relationship type',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    meta: {
                      $ref: `#/resources/${name}/schema/metadata`
                    },
                    data: {
                      type: 'array',
                      items: {
                        type: 'object',
                      }
                    },
                    includes: {
                      type: 'array',
                      items: {
                        type: 'object'
                      }
                    }
                  }
                }
              }
            }
          },
          400: {description: 'Wrong query parameters'},
          404: {description: 'Resource not found'},
        },
        getDirectOne: {
          200: {
            description: 'Resource relation received successfully. Response `\'data\'` field depends on relationship type',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    data: {
                      type: 'object',
                    },
                    includes: {
                      type: 'array',
                      items: {
                        type: 'object'
                      }
                    }
                  }
                }
              }
            }
          },
          400: {description: 'Wrong query parameters'},
          404: {description: 'Resource not found'},
        },
        deleteOne: {
          200: {
            description: 'Resource deleted successfully'
          },
          404: {description: 'Resource not found'},
        },
        getAll: {
          200: {
            description: 'Resource list received successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    meta: {
                      $ref: `#/resources/${name}/schema/metadata`
                    },
                    data: {
                      type: 'array',
                      items: {
                        type: 'object',
                        properties: {
                          links: {
                            type: 'object',
                            properties: {
                              self: {
                                type: 'string',
                              }
                            }
                          },
                          type: {
                            type: 'string',
                          },
                          id: {
                            type: 'string',
                          },
                          attributes: {
                            $ref: `#/resources/${name}/schema/attributes`,
                          },
                          relationships: {
                            $ref: `#/resources/${name}/schema/relationshipsLinks`,
                          }
                        }
                      }
                    },
                    includes: {
                      type: 'array',
                      items: {
                        type: 'object'
                      }
                    }
                  },
                }
              }
            }
          },
          400: {description: 'Wrong query parameters'},
        },
        getOne: {
          200: {
            description: 'Resource received successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    data: {
                      type: 'object',
                      properties: {
                        links: {
                          type: 'object',
                          properties: {
                            self: {
                              type: 'string',
                            }
                          }
                        },
                        type: {
                          type: 'string',
                        },
                        id: {
                          type: 'string',
                        },
                        attributes: {
                          $ref: `#/resources/${name}/schema/attributes`,
                        },
                        relationships: {
                          $ref: `#/resources/${name}/schema/relationshipsLinks`,
                        }
                      }
                    },
                    includes: {
                      type: 'array',
                      items: {
                        type: 'object'
                      }
                    }
                  },
                }
              }
            }
          },
          400: {description: 'Wrong query parameters'},
          404: {description: 'Resource not found'},
        },
        patchOne: {
          200: {
            description: 'Resource created successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    data: {
                      type: 'object',
                      properties: {
                        links: {
                          type: 'object',
                          properties: {
                            self: {
                              type: 'string',
                            }
                          }
                        },
                        type: {
                          type: 'string',
                        },
                        id: {
                          type: 'string',
                        },
                        attributes: {
                          $ref: `#/resources/${name}/schema/attributes`,
                        },
                        relationships: {
                          $ref: `#/resources/${name}/schema/relationshipsLinks`,
                        }
                      }
                    }
                  },
                }
              }
            }
          },
          422: {description: 'Unprocessable data'},
          404: {description: 'Resource not found'},
        },
        postOne: {
          200: {
            description: 'Resource updated successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    data: {
                      type: 'object',
                      properties: {
                        links: {
                          type: 'object',
                          properties: {
                            self: {
                              type: 'string',
                            }
                          }
                        },
                        type: {
                          type: 'string',
                        },
                        id: {
                          type: 'string',
                        },
                        attributes: {
                          $ref: `#/resources/${name}/schema/attributes`,
                        },
                        relationships: {
                          $ref: `#/resources/${name}/schema/relationshipsLinks`,
                        }
                      }
                    }
                  },
                }
              }
            }
          },
          422: {description: 'Unprocessable data'},
          404: {description: 'Resource not found'},
        }
      },
      requests: {
        deleteRelationship: {
          description: "Request `'data'` field depends on relationship type. For many-to-many relations it should contain an array.",
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                example: {
                  data: {
                    type: 'string',
                    id: 'string',
                  }
                }
              }
            }
          }
        },
        patchRelationship: {
          description: "Request `'data'` field depends on relationship type. For many-to-many relations it should contain an array.",
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                example: {
                  data: {
                    type: 'string',
                    id: 'string',
                  }
                }
              }
            }
          }
        },
        postRelationship: {
          description: "Request `'data'` field depends on relationship type. For many-to-many relations it should contain an array.",
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                example: {
                  data: {
                    type: 'string',
                    id: 'string',
                  }
                }
              }
            }
          }
        },
        getRelationship: {},
        getDirectAll: {},
        getDirectOne: {},
        deleteOne: {},
        getAll: {},
        getOne: {},
        patchOne: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  data: {
                    type: 'object',
                    properties: {
                      type: {
                        type: 'string',
                      },
                      id: {
                        type: 'string',
                      },
                      attributes: {
                        $ref: `#/resources/${name}/schema/attributes`,
                      },
                      relationships: {
                        $ref: `#/resources/${name}/schema/relationships`,
                      }
                    }
                  }
                },
              }
            }
          }
        },
        postOne: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  data: {
                    type: 'object',
                    properties: {
                      type: {
                        type: 'string',
                      },
                      attributes: {
                        $ref: `#/resources/${name}/schema/attributes`,
                      },
                      relationships: {
                        $ref: `#/resources/${name}/schema/relationships`,
                      }
                    }
                  }
                },
              }
            }
          }
        }
      },
      schema: {
        relationshipsLinks: {
          type: 'object',
          properties: Object
            .entries(relationships)
            .reduce((accum, [key, value]: [any, any]) => {
              const clone = JSON.parse(JSON.stringify(value));

              if (value.properties.items) {
                clone.properties.items.properties.links = {
                  type: 'object',
                  properties: {
                    self: {
                      type: 'string'
                    },
                    related: {
                      type: 'string'
                    }
                  }
                };
                accum[key] = clone;
              } else {
                clone.properties.links = {
                  type: 'object',
                  properties: {
                    self: {
                      type: 'string'
                    },
                    related: {
                      type: 'string'
                    }
                  }
                };
                accum[key] = clone;
              }

              return accum;
            }, {}),
        },
        relationships: {
          properties: relationships,
          type: 'object',
        },
        attributes: {
          properties: attributes,
          type: 'object',
        },
        metadata: {
          type: 'object',
          properties: {
            totalItems: {
              type: 'integer'
            },
            pageNumber: {
              type: 'integer'
            },
            pageSize: {
              type: 'integer'
            }
          }
        }
      }
    };
  }

  public static preparePathParameters(entityName: string, method: MethodName): ReferenceObject[] {
    switch (method) {
      case 'deleteRelationship':
      case 'getRelationship':
      case 'patchRelationship':
      case 'postRelationship':
      case 'getDirectAll': {
        return [
          {
            $ref: `#/resources/${entityName}/parameters/${PARAMS_RESOURCE_ID}`,
          },
          {
            $ref: `#/resources/${entityName}/parameters/${PARAMS_RELATION_NAME}`,
          }
        ];
      }
      case 'getDirectOne': {
        return [
          {
            $ref: `#/resources/${entityName}/parameters/${PARAMS_RESOURCE_ID}`,
          },
          {
            $ref: `#/resources/${entityName}/parameters/${PARAMS_RELATION_NAME}`,
          },
          {
            $ref: `#/resources/${entityName}/parameters/${PARAMS_RELATION_ID}`,
          }
        ];
      }
      case 'deleteOne':
      case 'patchOne':
      case 'getOne': {
        return [
          {
            $ref: `#/resources/${entityName}/parameters/${PARAMS_RESOURCE_ID}`,
          }
        ];
      }
      default: {
        return [];
      }
    }
  }

  public static prepareQueryParameters(entityName: string, method: MethodName): ReferenceObject[] {
    switch (method) {
      case 'getDirectAll':
      case 'getAll': {
        return [
          {
            $ref: `#/resources/${entityName}/parameters/sort`,
          },
          {
            $ref: `#/resources/${entityName}/parameters/include`,
          },
          {
            $ref: `#/resources/${entityName}/parameters/filter`,
          },
          {
            $ref: `#/resources/${entityName}/parameters/page`,
          }
        ];
      }
      case 'getDirectOne':
      case 'getOne': {
        return [
          {
            $ref: `#/resources/${entityName}/parameters/include`,
          },
        ];
      }
      default: {
        return [];
      }
    }
  }

  public static prepareResponses(entityName: string, method: MethodName): Record<string, ReferenceObject> {
    switch (method) {
      case 'deleteRelationship':
      case 'patchRelationship':
      case 'postRelationship':
      case 'patchOne':
      case 'postOne': {
        return {
          200: {
            $ref: `#/resources/${entityName}/responses/${method}/200`
          },
          422: {
            $ref: `#/resources/${entityName}/responses/${method}/422`
          },
          404: {
            $ref: `#/resources/${entityName}/responses/${method}/404`
          }
        };
      }
      case 'getDirectAll':
      case 'getDirectOne':
      case 'getOne': {
        return {
          200: {
            $ref: `#/resources/${entityName}/responses/${method}/200`
          },
          400: {
            $ref: `#/resources/${entityName}/responses/${method}/400`
          },
          404: {
            $ref: `#/resources/${entityName}/responses/${method}/404`
          }
        };
      }
      case 'getRelationship':
      case 'deleteOne': {
        return {
          200: {
            $ref: `#/resources/${entityName}/responses/${method}/200`
          },
          404: {
            $ref: `#/resources/${entityName}/responses/${method}/404`
          }
        };
      }
      case 'getAll': {
        return {
          200: {
            $ref: `#/resources/${entityName}/responses/${method}/200`
          },
          400: {
            $ref: `#/resources/${entityName}/responses/${method}/400`
          }
        };
      }
      default: {
        throw new Error(`Method '${method}' unsupported`);
      }
    }
  }

  public static prepareRequest(entityName: string, method: MethodName): ReferenceObject {
    return {
      $ref: `#/resources/${entityName}/requests/${method}`
    };
  }

  public static prepareMethodName(method: MethodName): string {
    switch (method) {
      case 'getRelationship':
      case 'getDirectAll':
      case 'getDirectOne':
      case 'getAll':
      case 'getOne': {
        return 'get';
      }
      case 'postRelationship':
      case 'postOne': {
        return 'post';
      }
      case 'patchRelationship':
      case 'patchOne': {
        return 'patch';
      }
      case 'deleteRelationship':
      case 'deleteOne': {
        return 'delete';
      }
      default: {
        throw new Error(`Method '${method}' unsupported`);
      }
    }
  }

  public static preparePath(path: string): string {
    let swaggerPath = path;

    if (path.includes(`:${PARAMS_RESOURCE_ID}`)) {
      swaggerPath = swaggerPath.replace(`:${PARAMS_RESOURCE_ID}`, `{${PARAMS_RESOURCE_ID}}`);
    }

    if (path.includes(`:${PARAMS_RELATION_NAME}`)) {
      swaggerPath = swaggerPath.replace(`:${PARAMS_RELATION_NAME}`, `{${PARAMS_RELATION_NAME}}`);
    }

    if (path.includes(`:${PARAMS_RELATION_ID}`)) {
      swaggerPath = swaggerPath.replace(`:${PARAMS_RELATION_ID}`, `{${PARAMS_RELATION_ID}}`);
    }

    return swaggerPath;
  }

  public static prepareTag(entityName: string, method: MethodName): TagObject {
    switch (method) {
      case 'deleteRelationship':
      case 'getRelationship':
      case 'patchRelationship':
      case 'postRelationship': {
        return {
          description: `Operations about "${paramCase(entityName)}" type relationships`,
          name: `${entityName} / Relationships`,
        };
      }
      case 'getDirectAll':
      case 'getDirectOne': {
        return {
          description: `Get "${paramCase(entityName)}" type relationships full info`,
          name: `${entityName} / Direct`,
        };
      }
      default: {
        return {
          description: `Operations about "${paramCase(entityName)}" resource type`,
          name: entityName,
        };
      }
    }
  }

  public static prepareDocument(): OpenAPIObject {
    const document: any = {
      openapi: '3.0.3',
      info: {
        title: 'CMP Platform API Swagger',
        description: 'This documentation describes API built according to https://jsonapi.org specification'
      },
      components: {
        schemas: Object
          .entries(this.resources)
          .reduce((accum, [key, value]: [any, any]) => {
            accum[`${key}Relationships`] = value.schema.relationships;
            accum[`${key}Attributes`] = value.schema.attributes;
            return accum;
          }, {}),
      },
      resources: this.resources,
      paths: this.paths,
      tags: this.tags,
    };

    if (this.config.apiHost) {
      document.servers = [{
        url: `${this.config.apiHost}/${this.config.apiPrefix || ''}`
      }];
    }

    if (this.config.version) {
      document.info.version = this.config.version;
    }

    if (this.config.tokenUrl) {
      document.components.securitySchemes = {
        authorisation: {
          type: 'oauth2',
          flows: {
            clientCredentials: {
              tokenUrl: this.config.tokenUrl,
              scopes: {
                'SRE.api': 'SRE Tools API'
              }
            },
          }
        }
      };
    }

    return document;
  }

  public static setConfig(config: SwaggerConfig): void {
    this.config = config;
  }

  public static getConfig(): SwaggerConfig {
    return this.config;
  }

  public static addEntity(entity: Entity): void {
    this.entities.push(entity);
  }

  public static getEntities(): Entity[] {
    return this.entities;
  }

  public static clear(): void {
    this.resources = {};
    this.entities = [];
    this.config = {};
    this.paths = {};
    this.tags = [];
  }
}

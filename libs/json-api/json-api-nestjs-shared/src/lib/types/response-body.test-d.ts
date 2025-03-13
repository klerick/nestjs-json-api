import { expectAssignable } from 'tsd';

import {
  Attributes,
  ResourceObject,
  BaseMeta,
  Include,
  ResourceObjectRelationships,
} from './response-body';
import { Users } from '../utils/___test___/test-classes.helper';

const CheckBaseMeta = {
  meta: { time: 1 },
} satisfies BaseMeta;

const CheckBaseMetaExtend = {
  meta: { time: 1, someData: '' },
} satisfies BaseMeta<'object', { someData: string }>;

const CheckBaseMetaForArray = {
  meta: { time: 1, pageSize: 0, pageNumber: 0, totalItems: 0 },
} satisfies BaseMeta<'array'>;

expectAssignable<BaseMeta>(CheckBaseMeta);
expectAssignable<BaseMeta<'object', { someData: string }>>(CheckBaseMetaExtend);
expectAssignable<BaseMeta<'array'>>(CheckBaseMetaForArray);

const CheckAttributes = {
  firstName: '',
  lastName: '',
  login: '',
  isActive: null,
  testDate: new Date(),
  testArrayNull: null,
  testReal: [1],
  createdAt: new Date(),
  updatedAt: new Date(),
} satisfies Attributes<Users>;

expectAssignable<Attributes<Users>>(CheckAttributes);

const CheckInclude = {
  id: '1',
  type: 'users',
  attributes: CheckAttributes,
  relationships: {
    addresses: {
      links: {
        self: 'selflinks',
      },
    },
    manager: {
      links: {
        self: 'selflinks',
      },
      data: {
        type: 'users',
        id: 'dssd',
      },
    },
    comments: {
      links: {
        self: 'selfLinks',
      },
      data: [{ id: '1', type: 'comments' }],
    },
    roles: {
      links: {
        self: 'selfLinks',
      },
      data: [{ id: '1', type: 'roles' }],
    },
    userGroup: {
      links: { self: 'selfLinks' },
      data: null,
    },
  },
  links: { self: 'selfLinks' },
} satisfies Include<Users, 'id'>;

expectAssignable<Include<Users, 'id'>>(CheckInclude);

const CheckResourceObject = {
  meta: CheckBaseMeta.meta,
  data: {
    id: '1',
    type: 'users',
    attributes: CheckAttributes,
    links: { self: 'selfLinks' },
  },
} satisfies ResourceObject<Users>;

const CheckResourceObjectArray = {
  meta: CheckBaseMetaForArray.meta,
  data: [
    {
      id: '1',
      type: 'users',
      attributes: CheckAttributes,
      relationships: {
        addresses: {
          links: {
            self: 'selflinks',
          },
        },
        manager: {
          links: {
            self: 'selflinks',
          },
          data: {
            type: 'users',
            id: 'dssd',
          },
        },
        comments: {
          links: {
            self: 'selfLinks',
          },
          data: [{ id: '1', type: 'comments' }],
        },
        roles: {
          links: {
            self: 'selfLinks',
          },
          data: [{ id: '1', type: 'roles' }],
        },
        userGroup: {
          links: { self: 'selfLinks' },
          data: null,
        },
      },
      links: { self: 'selfLinks' },
    },
  ],
} satisfies ResourceObject<Users, 'array'>;

expectAssignable<ResourceObject<Users>>(CheckResourceObject);
expectAssignable<ResourceObject<Users, 'array'>>(CheckResourceObjectArray);

const CheckResourceObjectRelationships = {
  meta: {
    time: 1,
  },
  data: {
    id: '1',
    type: 'users-groups',
  },
} satisfies ResourceObjectRelationships<Users, 'id', 'userGroup'>;

const CheckResourceObjectRelationshipsArray = {
  meta: {
    time: 1,
  },
  data: [
    {
      id: '1',
      type: 'users-groups',
    },
  ],
} satisfies ResourceObjectRelationships<Users, 'id', 'roles'>;

expectAssignable<ResourceObjectRelationships<Users, 'id', 'userGroup'>>(
  CheckResourceObjectRelationships
);
expectAssignable<ResourceObjectRelationships<Users, 'id', 'roles'>>(
  CheckResourceObjectRelationshipsArray
);

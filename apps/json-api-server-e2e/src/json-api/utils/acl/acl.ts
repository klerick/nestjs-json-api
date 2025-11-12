import {
  AbilityBuilder as NativeAbilityBuilder,
  AbilityTuple,
  createMongoAbility,
  InferSubjects,
  MongoAbility,
} from '@casl/ability';
import { JsonBaseController } from '@klerick/json-api-nestjs';
import { aclRegistry, allType } from './microorm';

export * from './data-test'

import { UserRole } from '@nestjs-json-api/microorm-database';

type ClassNames = keyof typeof aclRegistry;
type EntityType = (typeof allType)[number];


type SelectType = `${ClassNames}`;

export type DefaultSubjects = InferSubjects<EntityType> | SelectType;
export type DefaultActions = keyof JsonBaseController<object, 'id'>;

type TupleAbility<
  Subjects extends DefaultSubjects = DefaultSubjects,
  Actions extends string = DefaultActions,
> = {
  [K in Actions]: AbilityTuple<K, Subjects>;
};
type ValueOf<T> = T[keyof T];

type Ability<
  Subjects extends DefaultSubjects = DefaultSubjects,
  Actions extends string = DefaultActions
> = ValueOf<TupleAbility<Subjects, Actions>>;


export class AbilityBuilder<
  Roles extends string,
  Subjects extends DefaultSubjects = DefaultSubjects,
  Actions extends string = DefaultActions
> extends NativeAbilityBuilder<MongoAbility<Ability<DefaultSubjects, DefaultActions>>> {
  constructor(
    private readonly permissions: Permissions<Roles, Subjects, Actions>
  ) {
    super(createMongoAbility);
  }

  extend = (role: Roles): void => {
    this.permissionsFor(role);
  };

  permissionsFor(role: Roles): this {
    const rolePermissions = this.permissions[role];
    if (rolePermissions) {
      rolePermissions(this);
    }
    return this;
  }
}

export type DefinePermissions<
  Roles extends string,
  Subjects extends DefaultSubjects = DefaultSubjects,
  Actions extends string = DefaultActions
> = (builder: AbilityBuilder<Roles, Subjects, Actions>) => void;

export type Permissions<
  Roles extends string = UserRole,
  Subjects extends DefaultSubjects = DefaultSubjects,
  Actions extends string = DefaultActions
> = Partial<Record<Roles, DefinePermissions<Roles, Subjects, Actions>>>;

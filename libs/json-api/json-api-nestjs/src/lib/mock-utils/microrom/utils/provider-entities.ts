import { TestingModule } from '@nestjs/testing';
import { EntityManager } from '@mikro-orm/core';
import {
  Users,
  Addresses,
  Comments,
  Roles,
  UserGroups,
  Notes,
} from '../entities';

export function getRepository(module: TestingModule, emToken: symbol) {
  const em = module.get<EntityManager>(emToken);

  const userRepository = em.getRepository(Users);
  const addressesRepository = em.getRepository(Addresses);
  const notesRepository = em.getRepository(Notes);
  const commentsRepository = em.getRepository(Comments);
  const rolesRepository = em.getRepository(Roles);
  const userGroupRepository = em.getRepository(UserGroups);

  return {
    userRepository,
    addressesRepository,
    notesRepository,
    commentsRepository,
    rolesRepository,
    userGroupRepository,
  };
}

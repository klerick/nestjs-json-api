import { EntityManager } from '@mikro-orm/core';
import { faker } from '@faker-js/faker';
import {
  Addresses,
  CommentKind,
  Comments,
  Notes,
  Roles,
  UserGroups,
  Users,
} from '../entities';

export async function pullAddress() {
  const address = new Addresses();
  address.city = faker.location.city();
  address.country = faker.location.country();
  address.arrayField = [
    faker.string.alphanumeric(5),
    faker.string.alphanumeric(5),
  ];
  address.state = faker.location.state();
  return address;
}

export async function pullComment() {
  const comment = new Comments();
  comment.text = faker.lorem.paragraph(faker.number.int(5));
  comment.kind = CommentKind.Comment;
  return comment;
}

export async function pullNote() {
  const note = new Notes();
  note.text = faker.lorem.paragraph(faker.number.int(5));
  return note;
}

export async function pullRole() {
  const role = new Roles();
  role.key = faker.string.alphanumeric(5);
  role.name = faker.string.alphanumeric(5);
  return role;
}

export async function pullUser() {
  const user = new Users();
  user.firstName = faker.person.firstName();
  user.lastName = faker.person.lastName();
  user.isActive = faker.datatype.boolean();
  user.login = faker.internet.userName({
    lastName: user.lastName,
    firstName: user.firstName,
  });
  user.testReal = [faker.number.float({ fractionDigits: 4 })];
  user.testArrayNull = null;

  user.testDate = faker.date.anytime();

  return user;
}

export async function pullUserGroup() {
  const userGroup = new UserGroups();
  userGroup.label = faker.string.alphanumeric(5);
  return userGroup;
}

export async function pullAllData(em: EntityManager) {
  const user = await pullUser();

  const address1 = await pullAddress();
  const address2 = await pullAddress();

  const note1 = await pullNote();
  const note2 = await pullNote();
  const note3 = await pullNote();

  const comment1 = await pullComment();
  const comment2 = await pullComment();
  const comment3 = await pullComment();
  const comment4 = await pullComment();

  const userGroup1 = await pullUserGroup();
  const userGroup2 = await pullUserGroup();
  const userGroup3 = await pullUserGroup();

  const role1 = await pullRole();
  const role2 = await pullRole();
  const role3 = await pullRole();

  const roleX1 = await pullRole();
  const roleX2 = await pullRole();
  const roleX3 = await pullRole();

  const managerUser = await pullUser();

  user.addresses = address1;
  address1.user = user;
  user.notes.add(note1, note2, note3);
  user.comments.add(comment1, comment2, comment3, comment4);
  user.userGroup = userGroup1;
  user.roles.add(roleX1, roleX2, roleX3);
  user.manager = managerUser;

  managerUser.addresses = address2;
  managerUser.userGroup = userGroup3;

  await em.persistAndFlush([
    user,
    address1,
    address2,
    note1,
    note2,
    note3,
    comment1,
    comment2,
    comment3,
    comment4,
    userGroup1,
    userGroup2,
    userGroup3,
    role1,
    role2,
    role3,
    roleX1,
    roleX2,
    roleX3,
    managerUser,
  ]);

  await em.flush();

  return user;
}

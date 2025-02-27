import { Repository } from 'typeorm';
import { faker } from '@faker-js/faker';
import {
  Addresses,
  CommentKind,
  Comments,
  Notes,
  Roles,
  UserGroups,
  Users,
} from './entities';

export async function pullAddress(addressRepo: Repository<Addresses>) {
  const address = new Addresses();
  address.city = faker.location.city();
  address.country = faker.location.country();
  address.arrayField = [
    faker.string.alphanumeric(5),
    faker.string.alphanumeric(5),
  ];
  address.state = faker.location.state();
  return addressRepo.save(address);
}

export async function pullComment(commentRepo: Repository<Comments>) {
  const comment = new Comments();
  comment.text = faker.lorem.paragraph(faker.number.int(5));
  comment.kind = CommentKind.Comment;
  return commentRepo.save(comment);
}

export async function pullNote(noteRepo: Repository<Notes>) {
  const note = new Notes();
  note.text = faker.lorem.paragraph(faker.number.int(5));
  return noteRepo.save(note);
}

export async function pullRole(roleRepo: Repository<Roles>) {
  const role = new Roles();
  role.key = faker.string.alphanumeric(5);
  role.name = faker.string.alphanumeric(5);
  return roleRepo.save(role);
}

export async function pullUser(userPero: Repository<Users>) {
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

  return userPero.save(user);
}

export async function pullUserGroup(userGroupRepo: Repository<UserGroups>) {
  const userGroup = new UserGroups();
  userGroup.label = faker.string.alphanumeric(5);
  return userGroupRepo.save(userGroup);
}

export async function pullAllData(
  userPero: Repository<Users>,
  addressRepo?: Repository<Addresses>,
  noteRepo?: Repository<Notes>,
  commentRepo?: Repository<Comments>,
  roleRepo?: Repository<Roles>,
  userGroupRepo?: Repository<UserGroups>
) {
  const user = await pullUser(userPero);
  if (addressRepo) {
    user.addresses = await pullAddress(addressRepo);
  }

  if (noteRepo) {
    user.notes = [
      await pullNote(noteRepo),
      await pullNote(noteRepo),
      await pullNote(noteRepo),
    ];
  }

  if (commentRepo) {
    user.comments = [
      await pullComment(commentRepo),
      await pullComment(commentRepo),
      await pullComment(commentRepo),
      await pullComment(commentRepo),
    ];
  }

  if (userGroupRepo) {
    await pullUserGroup(userGroupRepo);
    await pullUserGroup(userGroupRepo);
    await pullUserGroup(userGroupRepo);
    user.userGroup = await pullUserGroup(userGroupRepo);
  }

  if (roleRepo) {
    await pullRole(roleRepo);
    await pullRole(roleRepo);
    await pullRole(roleRepo);
    user.roles = [
      await pullRole(roleRepo),
      await pullRole(roleRepo),
      await pullRole(roleRepo),
    ];
  }

  user.manager = await pullUser(userPero);
  await pullUser(userPero);
  await pullUser(userPero);
  await pullUser(userPero);
  await userPero.save(user);
  return user;
}

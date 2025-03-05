import { Collection } from '@mikro-orm/core';
type IUsers = Users;
export class Users {
  public id!: number;
  public login!: string;
  public firstName!: string;
  public testReal: number[] = [];
  public testArrayNull!: number[] | null;
  public lastName!: string | null;
  public isActive!: null;
  public testDate!: Date;
  public createdAt: Date = new Date();
  public updatedAt: Date = new Date();

  public addresses!: IAddresses;
  public manager!: IUsers;
  public roles = new Collection<Roles>(this);
  public comments!: Comments[];
  public userGroup!: UserGroups | null;
}
type IRoles = Roles;
export class Roles {
  public id!: number;
  public name!: string;
  public key!: string;
  public isDefault!: boolean;
  createdAt: Date = new Date();
  updatedAt: Date = new Date();
}
type IUserGroups = UserGroups;
export class UserGroups {
  public id!: number;
  public label!: string;
}
type IAddresses = Addresses;
export class Addresses {
  public id!: number;
  public city!: string;
  public state!: string;
  public country!: string;
  public arrayField!: string[];
  createdAt: Date = new Date();
  updatedAt: Date = new Date();
}
type IComments = Comments;
export class Comments {
  public id!: number;
  public kind!: CommentKind;
  createdAt: Date = new Date();
  updatedAt: Date = new Date();
}
export enum CommentKind {
  Comment = 'COMMENT',
  Message = 'MESSAGE',
  Note = 'NOTE',
}

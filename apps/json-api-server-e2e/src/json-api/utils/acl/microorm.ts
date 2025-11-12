import {
  UsersAcl,
  ArticleAcl,
  CategoryAcl,
  TagAcl,
  PostAcl,
  CommentAcl,
  DocumentAcl,
  UserProfileAcl,
} from '@nestjs-json-api/microorm-database';

export const allType = [
  UsersAcl,
  ArticleAcl,
  CategoryAcl,
  TagAcl,
  PostAcl,
  CommentAcl,
  DocumentAcl,
  UserProfileAcl,
] as const;


export const aclRegistry = {
  UsersAcl,
  ArticleAcl,
  CategoryAcl,
  TagAcl,
  PostAcl,
  CommentAcl,
  DocumentAcl,
  UserProfileAcl,
} as const;


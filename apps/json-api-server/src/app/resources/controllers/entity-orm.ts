import { Users as tUsers } from '@nestjs-json-api/typeorm-database';
import { Users as mkUsers } from '@nestjs-json-api/microorm-database';

import { BookList as tBookList } from '@nestjs-json-api/typeorm-database';
import { BookList as mkBookList } from '@nestjs-json-api/microorm-database';

const Users = process.env['ORM_TYPE'] === 'typeorm' ? tUsers : mkUsers;
const BookList = process.env['ORM_TYPE'] === 'typeorm' ? tBookList : mkBookList;

export { Users, BookList };

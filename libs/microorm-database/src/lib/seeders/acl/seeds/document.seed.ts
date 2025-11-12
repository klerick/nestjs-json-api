import { Seeder } from '@mikro-orm/seeder';
import { EntityManager } from '@mikro-orm/postgresql';
import type { EntityData } from '@mikro-orm/core';
import { AclContext } from '../acl.seed';
import { DocumentFactory } from '../factory';
import { DocumentAcl } from '../../../entities';

export class DocumentSeed extends Seeder {
  async run(em: EntityManager, context: AclContext): Promise<void> {
    const documentFactory = new DocumentFactory(em);
    const alice = context.aclContext.users.find(user => user.login === 'alice')!;
    const bob = context.aclContext.users.find(user => user.login === 'bob')!;
    const charlie = context.aclContext.users.find(user => user.login === 'charlie')!;
    const admin = context.aclContext.users.find(user => user.login === 'admin')!;
    const moderator = context.aclContext.users.find(user => user.login === 'moderator')!;

    const documentData: EntityData<DocumentAcl>[] = [{
      owner: alice,
      sharedWith: [bob.id, charlie.id], // ACL test: shared access
    },{
      owner: admin,
      isPublic: true, // ACL test: public document (anyone can read)
    },{
      owner: bob,
    }, {
      owner: moderator,
      sharedWith: [admin.id, alice.id],
    }, {
      owner: charlie,
      sharedWith: [alice.id]
    }]

    const count = documentData.length;
    context.aclContext.documents = await documentFactory
      .each((document) => Object.assign(document, documentData.shift()))
      .create(count);
  }
}

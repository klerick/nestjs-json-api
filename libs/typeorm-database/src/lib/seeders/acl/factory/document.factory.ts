import { FactorizedAttrs } from '@jorgebodega/typeorm-factory';
import { faker } from '@faker-js/faker';
import { DocumentAcl } from '../../../entities/acl-test';
import { BaseFactory } from '../../base-factory';


export class DocumentFactory extends BaseFactory<DocumentAcl> {
  entity = DocumentAcl;

  protected attrs(): FactorizedAttrs<DocumentAcl> {
    const extensions = [
      { ext: 'pdf', mime: 'application/pdf' },
      { ext: 'jpg', mime: 'image/jpeg' },
      { ext: 'png', mime: 'image/png' },
      { ext: 'docx', mime: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' },
      { ext: 'xlsx', mime: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' },
      { ext: 'txt', mime: 'text/plain' },
      { ext: 'zip', mime: 'application/zip' },
      { ext: 'mp4', mime: 'video/mp4' },
      { ext: 'mp3', mime: 'audio/mpeg' },
    ];

    const fileType = faker.helpers.arrayElement(extensions);
    const filename = `${faker.word.noun()}-${faker.string.alphanumeric(8)}.${fileType.ext}`;
    const dirPath = faker.system.directoryPath();
    return {
      filename: filename,
      mimeType: fileType.mime,
      size: faker.number.int({ min: 1000, max: 10000000 }),
      path: `/uploads${dirPath}/${filename}`,
      sharedWith: [],
      isPublic: false,
    };
  }
}

import { postRelationshipSchema, PostRelationshipSchema } from './';
import { ZodError } from 'zod';

describe('zod-input-post-relationship-schema', () => {
  it('should be ok', () => {
    const check = {
      type: 'type',
      id: 'id',
    };
    const check1 = [
      {
        type: 'type',
        id: 'id',
      },
    ];
    expect(postRelationshipSchema.parse(check)).toEqual(check);
    expect(postRelationshipSchema.parse(check1)).toEqual(check1);
  });
  it('should be not ok', () => {
    const check = {
      asd: 'sdfsdf',
    };
    const check1: any[] = [];
    const check2 = {
      sdfs: 'dsfsdf',
      type: 'type',
      id: 'id',
    };
    const check3 = null;
    const check4 = true;
    const check5 = 'dsfsdf';

    const checkArray = [check, check1, check2, check3, check4, check5];
    expect.assertions(checkArray.length);
    for (const item of checkArray) {
      try {
        postRelationshipSchema.parse(item);
      } catch (e) {
        expect(e).toBeInstanceOf(ZodError);
      }
    }
  });
});

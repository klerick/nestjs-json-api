import { patchRelationshipSchema, PatchRelationshipSchema } from './';
import { ZodError } from 'zod';

describe('zod-input-patch-relationship-schema', () => {
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
    const check2 = null;
    const check3: any[] = [];
    expect(patchRelationshipSchema.parse(check)).toEqual(check);
    expect(patchRelationshipSchema.parse(check1)).toEqual(check1);
    expect(patchRelationshipSchema.parse(check2)).toEqual(check2);
    expect(patchRelationshipSchema.parse(check3)).toEqual(check3);
  });
  it('should be not ok', () => {
    const check = {
      asd: 'sdfsdf',
    };

    const check2 = {
      sdfs: 'dsfsdf',
      type: 'type',
      id: 'id',
    };
    const check4 = true;
    const check5 = 'dsfsdf';

    const checkArray = [check, check2, check4, check5];
    expect.assertions(checkArray.length);
    for (const item of checkArray) {
      try {
        patchRelationshipSchema.parse(item);
      } catch (e) {
        expect(e).toBeInstanceOf(ZodError);
      }
    }
  });
});

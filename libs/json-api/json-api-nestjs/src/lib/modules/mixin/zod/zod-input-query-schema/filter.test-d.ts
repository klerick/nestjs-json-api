import { ZodFilterInputQuery } from './filter';
import { Users } from '../../../../utils/___test___/test-classes.helper';
import { expectAssignable, expectNotAssignable } from 'tsd';

type FilterType = ZodFilterInputQuery<Users, 'id'>;
const checkShape = {
  target: {
    id: {
      some: '',
      eq: '',
    },
    testArrayNull: {
      some: '',
    },
    addresses: {
      eq: 'null',
    },
  },
  relation: {
    addresses: {
      arrayField: {
        in: '',
      },
    },
  },
} satisfies FilterType;
expectAssignable<FilterType>(checkShape);
expectNotAssignable<FilterType>({
  ...checkShape,
  notAllow: {},
});
expectNotAssignable<FilterType>({
  ...checkShape,
  addresses: {
    in: null,
  },
});

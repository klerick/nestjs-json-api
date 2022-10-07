import { ApiProperty, ApiOperation } from '@nestjs/swagger';
import { FilterOperand as FilterOperandType } from '../../types-common';

const title = 'is equal to the conditional of query';

export const OperandsMapTitle = {
  [FilterOperandType.in]: `${title} "WHERE 'attribute_name' IN ('value1', 'value2')"`,
  [FilterOperandType.nin]: `${title} "WHERE 'attribute_name' NOT IN ('value1', 'value1')"`,
  [FilterOperandType.eq]: `${title} "WHERE 'attribute_name' = 'value1'`,
  [FilterOperandType.ne]: `${title} "WHERE 'attribute_name' <> 'value1'`,
  [FilterOperandType.gt]: `${title} "WHERE 'attribute_name' > 'value1'`,
  [FilterOperandType.gte]: `${title} "WHERE 'attribute_name' >= 'value1'`,
  [FilterOperandType.like]: `${title} "WHERE 'attribute_name' ILIKE %value1%`,
  [FilterOperandType.lt]: `${title} "WHERE 'attribute_name' < 'value1'`,
  [FilterOperandType.lte]: `${title} "WHERE 'attribute_name' <= 'value1'`,
  [FilterOperandType.regexp]: `${title} "WHERE 'attribute_name' ~* value1`,
  [FilterOperandType.some]: `${title} "WHERE 'attribute_name' && [value1]`,
};

export class FilterOperand {
  @ApiProperty({
    title: OperandsMapTitle[FilterOperandType.in],
    required: false,
    type: 'array',
    items: {
      type: 'string',
    },
  })
  [FilterOperandType.in]: string[];

  @ApiProperty({
    title: OperandsMapTitle[FilterOperandType.nin],
    required: false,
    type: 'array',
    items: {
      type: 'string',
    },
  })
  [FilterOperandType.nin]: string[];

  @ApiProperty({
    title: OperandsMapTitle[FilterOperandType.eq],
    required: false,
  })
  [FilterOperandType.eq]: string;
  @ApiProperty({
    title: OperandsMapTitle[FilterOperandType.ne],
    required: false,
  })
  [FilterOperandType.ne]: string;

  @ApiProperty({
    title: OperandsMapTitle[FilterOperandType.gte],
    required: false,
  })
  [FilterOperandType.gte]: string;
  @ApiProperty({
    title: OperandsMapTitle[FilterOperandType.gt],
    required: false,
  })
  [FilterOperandType.gt]: string;

  @ApiProperty({
    title: OperandsMapTitle[FilterOperandType.lt],
    required: false,
  })
  [FilterOperandType.lt]: string;
  @ApiProperty({
    title: OperandsMapTitle[FilterOperandType.lte],
    required: false,
  })
  [FilterOperandType.lte]: string;

  @ApiProperty({
    title: OperandsMapTitle[FilterOperandType.regexp],
    required: false,
  })
  [FilterOperandType.regexp]: string;
  @ApiProperty({
    title: OperandsMapTitle[FilterOperandType.some],
    required: false,
  })
  [FilterOperandType.some]: string;
}

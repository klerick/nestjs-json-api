import { ArgumentMetadata, PipeTransform } from '@nestjs/common';

export class MetaTransformPipe
  implements PipeTransform<Record<string, unknown>, Record<string, unknown>>
{
  transform(
    value: Record<string, unknown>,
    metadata: ArgumentMetadata
  ): Record<string, unknown> {
    return {
      ...value,
      transformedBy: 'MetaTransformPipe',
      transformedAt: Date.now(),
      adapter: 'typeorm',
    };
  }
}
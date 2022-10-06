import {Users} from 'database';
import {JsonApi, excludeMethod, JsonBaseController, InjectService, JsonApiService, QueryParams} from 'json-api-nestjs';
import {Get, Param} from '@nestjs/common';



@JsonApi(Users, {
  allowMethod: excludeMethod(['deleteRelationship']),
  requiredSelectField: true
})
export class ExtendUserController extends JsonBaseController<Users>
{
  @InjectService() public service: JsonApiService<Users>;

  public override getAll(query: QueryParams<Users>){
    return this.service.getAll({query})
  }

  @Get(':id/example')
  testOne(@Param('id') id) {
    return id;
  }
}

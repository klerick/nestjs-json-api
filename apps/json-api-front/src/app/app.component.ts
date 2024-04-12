import { Component, inject, OnInit } from '@angular/core';
import { NxWelcomeComponent } from './nx-welcome.component';
import { JsonApiSdkService } from 'json-api-nestjs-sdk';
import { AtomicFactory } from 'json-api-nestjs-sdk/json-api-nestjs-sdk.module';
import {
  JSON_RPC,
  RPC_BATCH,
  Rpc,
} from '@klerick/nestjs-json-rpc-sdk/json-rpc-sdk.module';

import { RpcService as IRpcService } from '@nestjs-json-api/type-for-rpc';
import { switchMap } from 'rxjs';

type RpcMap = {
  RpcService: IRpcService;
};

@Component({
  standalone: true,
  imports: [NxWelcomeComponent],
  selector: 'nestjs-json-api-root',
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
})
export class AppComponent implements OnInit {
  private JsonApiSdkService = inject(JsonApiSdkService);
  private atomicFactory = inject(AtomicFactory);
  private rpc = inject<Rpc<RpcMap>>(JSON_RPC);
  private rpcBatch = inject(RPC_BATCH);

  ngOnInit(): void {
    const rpc1 = this.rpc.RpcService.someMethode(1);

    const rpc2 = this.rpc.RpcService.methodeWithObjectParams({
      a: 1,
      b: 1,
    });

    this.rpcBatch(rpc2, rpc1).subscribe(([r2, r1]) => console.log(r1, r2));

    this.JsonApiSdkService.getAll(class Users {}, {
      page: {
        size: 2,
        number: 1,
      },
    }).subscribe((r) => console.log(r));

    class Addresses {
      id = 1;
    }

    class Users {
      id!: number;
      addresses = new Addresses();
      login!: string;
      firstName!: string;
      lastName!: string;
      roles!: Roles[];
    }

    class Roles {
      public id!: number;

      public name!: string;

      public key!: string;

      public isDefault!: boolean;

      public createdAt!: Date;

      public updatedAt!: Date;

      public users!: Users[];
    }

    const tmpUsers = new Users();
    tmpUsers.id = 1;
    this.JsonApiSdkService.getRelationships(tmpUsers, 'addresses').subscribe(
      (r) => console.log(r)
    );

    const roles = new Roles();
    roles.id = 10000;
    roles.name = 'testRolesAgain';
    roles.key = 'testRolesAgain';
    const newUser = new Users();
    newUser.addresses = new Addresses();
    newUser.roles = [roles];
    newUser.login = 'newLogin';

    this.atomicFactory()
      .postOne(roles)
      .postOne(newUser)
      .run()
      .pipe(
        switchMap((r) => {
          const [roles, user] = r;
          user.login = 'newUser';
          user.firstName = '';
          user.lastName = '';
          newUser.id = user.id;
          newUser.roles = [roles];
          return this.atomicFactory()
            .patchOne(user)
            .deleteRelationships(newUser, 'roles')
            .deleteOne(user)
            .deleteOne(roles)
            .run();
        })
      )
      .subscribe((r) => console.log(r));
  }
}

import { Component, Inject, OnInit } from '@angular/core';
import {JsonApiSdkService, EntityArray, JSON_SDK_WITH_MIXIN} from 'json-api-nestjs-sdk';
import {Users, Addresses} from 'database/entity'
import { map, Observable, shareReplay, switchMap } from 'rxjs';
import { Test } from './app.module';

@Component({
  selector: 'nestjs-json-api-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
})
export class AppComponent implements OnInit{
  oneUser$!: Observable<Users>;
  listAddresses$!: Observable<EntityArray<Addresses>>;
  listAllAddresses$!: Observable<EntityArray<Addresses>>;
  oneUserCode = `
    const user = new Users();
    user.id = 1;
    this.jsonApiSdkService.getOne<Users>(user, {include: ['roles', 'manager']});
  `
  listAddressesCode = `
  this.jsonApiSdkService.getList<Addresses>(
    Addresses,
    {
      include: ['user'],
      pagination: {
        number: 1, size: 3
      },
      filter: {
        target: {
          city: {
            like: 'Par'
          }
        },
        relation: {
          user: {
            id: {
              eq: '5'
            }
          }
        }
      },
      sort: {
        id: 'ASC'
      }
    }
  )
  `;
  listAllAddressesCode = `
  this.jsonApiSdkService.getAll<Addresses>(
    Addresses,
    {
      include: ['user']
    }
  )
  `
  deleteOneAddressesCode = `
    const addresses = new Addresses();
    addresses.id = 1;
    this.jsonApiSdkService.deleteOne<Addresses>(addresses);
  `
  postOneCode = `
    const userAddress = new Addresses();
    userAddress.id = 171;
    userAddress.city = 'NY';
    userAddress.country = 'US';
    this.jsonApiSdkService.postOne<Addresses>(userAddress).pipe(
      switchMap((result) => {
        const newUser = new Users();
        newUser.firstName = 'test12';
        newUser.login = 'test12';
        newUser.lastName = 'test12';
        newUser.addresses = result;
        return this.jsonApiSdkService.postOne<Users>(newUser)
      })
    )
  `
  patchOneCode = `
    this.jsonApiSdkService.getList<Addresses>(Addresses, {
      filter: {
        target: {
          city: {
            eq: 'NY city'
          }
        }
      }
    }).pipe(
      map((addresses) => addresses[0]),
      switchMap((address) => {
        const {createdAt, updatedAt, ...spreadAddres} = address;
        const updateAddres = Object.assign(new Addresses(), spreadAddres);
        updateAddres.country = 'USA';
        return this.jsonApiSdkService.patchOne<Addresses>(updateAddres)
      })
    )
  `
  tab = 'GetOne';
  constructor(
    private jsonApiSdkService: JsonApiSdkService,
    // @Inject(JSON_SDK_WITH_MIXIN) private service: any
    // private service: Test
  ) {
    // service.someMethode()
  }

  public ngOnInit(): void {
    const user = new Users();
    user.id = 1;

    this.oneUser$ = this.jsonApiSdkService.getOne<Users>(user, {include: ['roles', 'manager']})
    this.listAddresses$ = this.jsonApiSdkService.getList<Addresses>(
      Addresses,
      {
        include: ['user'],
        pagination: {
          number: 1, size: 3
        },
        filter: {
          target: {
            city: {like: 'Par'}
          },
          relation: {
            user: {
              id: {eq: '5'}
            }
          }
        },
        sort: {
          id: 'ASC'
        }
      }
    ).pipe(
      shareReplay(1)
    )

    this.listAllAddresses$ = this.jsonApiSdkService.getAll<Addresses>(Addresses, {
      include: ['user']
    }).pipe(
      shareReplay(1)
    )
  }
}


import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { JsonApiSdkService, EmptyArrayRelation } from 'json-api-nestjs-sdk';
import { Users, BookList, Addresses } from 'database/entity';
import { map, switchMap } from 'rxjs';

const user = new Users();
user.id = 17;

@Component({
  selector: 'nestjs-json-api-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppComponent implements OnInit {
  title = 'example-angular-client';
  dataList = this.jsonApiSdkService.getAll<Users>(
    Users,
    {
      filter: {
        target: {
          isActive: {
            eq: 'true',
          },
        },
      },
      include: ['comments', 'addresses'],
      page: {
        size: 5,
        number: 1,
      },
    },
    true
  );
  dataItem = this.jsonApiSdkService.getOne<Users>(
    Users,
    17,
    {
      fields: {
        target: ['login'],
        addresses: ['city', 'state'],
        comments: ['text', 'kind'],
      },
      include: ['comments', 'addresses'],
    },
    true
  );

  constructor(private jsonApiSdkService: JsonApiSdkService) {}

  ngOnInit(): void {
    this.jsonApiSdkService
      .getOne<Users>(
        Users,
        17,
        {
          fields: {
            target: ['login'],
            addresses: ['city', 'state'],
            comments: ['text', 'kind'],
          },
          include: ['comments', 'addresses'],
        },
        true
      )
      .pipe(
        switchMap(({ entity, meta }) => {
          const bookList = new BookList();
          bookList.users = [entity];
          bookList.text = 'Book list';
          return this.jsonApiSdkService.postOne<BookList>(bookList, true);
        }),
        switchMap(({ entity, meta }) => {
          const bookList = new BookList();
          bookList.id = entity.id;
          bookList.users = new EmptyArrayRelation();
          bookList.text = 'Change Text';
          return this.jsonApiSdkService.patchOne(bookList, true);
        }),
        switchMap(({ entity, meta }) => {
          return this.jsonApiSdkService.deleteOne(entity);
        })
      )
      .subscribe((r) => console.log(r));

    this.jsonApiSdkService
      .getRelationships(user, 'addresses')
      .subscribe((r) => console.log(r));
    this.jsonApiSdkService
      .getRelationships(user, 'comments')
      .subscribe((r) => console.log(r));

    this.jsonApiSdkService
      .getAll<Addresses>(Addresses)
      .pipe(
        map((r) => r[0]),
        switchMap((addresses) => {
          return this.jsonApiSdkService
            .getOne<Users>(Users, 18, { include: ['comments', 'addresses'] })
            .pipe(
              switchMap((user) => {
                user.addresses = addresses;
                return this.jsonApiSdkService.patchRelationships<Users>(
                  user,
                  'addresses'
                );
              })
            );
        })
      )
      .subscribe((r) => console.log(r));
  }
}

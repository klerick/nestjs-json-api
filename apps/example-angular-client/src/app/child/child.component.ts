import {
  ChangeDetectionStrategy,
  Component,
  inject,
  OnInit,
} from '@angular/core';
import { JsonApiSdkService } from 'json-api-nestjs-sdk';
import { BookList } from 'database/entity';

@Component({
  selector: 'nestjs-json-api-child',
  templateUrl: './child.component.html',
  styleUrls: ['./child.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChildComponent implements OnInit {
  jsonApiSdkService = inject(JsonApiSdkService);

  ngOnInit(): void {
    this.jsonApiSdkService.getAll(BookList).subscribe((r) => console.log(r));
  }
}

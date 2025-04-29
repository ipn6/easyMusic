import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TratamientoDatosComponent } from './tratamiento-datos.component';

describe('TratamientoDatosComponent', () => {
  let component: TratamientoDatosComponent;
  let fixture: ComponentFixture<TratamientoDatosComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [TratamientoDatosComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TratamientoDatosComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

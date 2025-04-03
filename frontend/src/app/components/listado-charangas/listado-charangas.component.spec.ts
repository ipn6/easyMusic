import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ListadoCharangasComponent } from './listado-charangas.component';

describe('ListadoCharangasComponent', () => {
  let component: ListadoCharangasComponent;
  let fixture: ComponentFixture<ListadoCharangasComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ListadoCharangasComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ListadoCharangasComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

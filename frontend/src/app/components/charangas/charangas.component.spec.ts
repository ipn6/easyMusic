import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CharangasComponent } from './charangas.component';

describe('CharangasComponent', () => {
  let component: CharangasComponent;
  let fixture: ComponentFixture<CharangasComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [CharangasComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CharangasComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

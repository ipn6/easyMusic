import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MusicosComponent } from './musicos.component';

describe('MusicosComponent', () => {
  let component: MusicosComponent;
  let fixture: ComponentFixture<MusicosComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [MusicosComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MusicosComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

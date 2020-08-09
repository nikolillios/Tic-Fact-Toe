import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { FactorLineComponent } from './factor-line.component';

describe('FactorLineComponent', () => {
  let component: FactorLineComponent;
  let fixture: ComponentFixture<FactorLineComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ FactorLineComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(FactorLineComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

import { Component, OnInit, Input, Output, EventEmitter, ViewChild, TemplateRef, ViewContainerRef } from '@angular/core';
import { State } from '../model/State.model';

@Component({
  selector: 'factor-line',
  templateUrl: './factor-line.component.html',
  styleUrls: ['./factor-line.component.css']
})
export class FactorLineComponent implements OnInit {

  public nums = [1, 2, 3, 4, 5, 6, 7, 8, 9];
  @Input() state = new State();
  @Output() selected = new EventEmitter<[number, number]>();
  @Output() submitted = new EventEmitter<[number, number]>();

  constructor() { }

  ngOnInit(): void {
  }

  select(value: number) {
    if (this.state.factors[0] == null) {
      this.state.factors[0] = value;
    } else if (this.state.factors[1] == null) {
      this.state.factors[1] = value;
    } else if (value == this.state.factors[0]) {
      this.state.factors[0] = null;
    } else if (value == this.state.factors[1]) {
      this.state.factors[1] = null;
    }
    this.selected.emit(this.state.factors);
  }

  submitFactors() {
    this.submitted.emit(this.state.factors);
  }

  marked(value: number) {
    for (let i = 0; i < this.state.factors.length; i++) {
      if (this.state.factors[i] == value) {
        return true;
      }
    }
    return false;
  }

}

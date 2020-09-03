import { Component, OnInit, Input } from '@angular/core';
import { State } from 'src/app/model/State.model';

@Component({
  selector: 'score-card',
  templateUrl: './score-card.component.html',
  styleUrls: ['./score-card.component.scss']
})
export class ScoreCardComponent implements OnInit {

  @Input() state: State;
  constructor() { }

  ngOnInit(): void {
  }

}

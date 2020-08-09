import { Component, OnInit, Input, Output, EventEmitter, ViewChild } from '@angular/core';
import io from "socket.io-client"
import { State } from "../model/State.model"

@Component({
  selector: 'gameboard',
  templateUrl: './gameboard.component.html',
  styleUrls: ['./gameboard.component.css']
})
export class GameboardComponent implements OnInit {

  @Output() selected = new EventEmitter<[number, number]>();
  @Input() state: State = new State();

  constructor() { }

  ngOnInit(): void {
  }

  ngAfterViewInit() {
  }

  markerColor(row, column) {
    let id = this.state.markers[row][column];
    return this.getPlayerWithId(id).color;
  }

  updateState(data: any) {
    this.state.values = data.values;
    this.state.players = data.players;
    this.state.factors = data.factors;
    this.state.markers = data.markers;
  }

  marked(row: number, column: number) {
    console.log(this.state);
    if (!this.state) { return false; }
    if (this.state.markers[row][column] != '0') {
      return true;
    }
    return false;
  }

  getPlayerWithId(id) {
    for (let i = 0; i < this.state.players.length; i++) {
      if (this.state.players[i].id == id) {
        return this.state.players[i];
      }
    }
    throw new Error('no such player');
  }

  registerClick(row: number, column: number) {
    this.selected.emit([row, column]);
  }


  rows() {
    return this.state ? Array.from(this.state.values.keys()) : []
  }

  columns() {
    return this.state ? Array.from(this.state.values[0].keys()) : []
  }

}

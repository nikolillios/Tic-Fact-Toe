import { Component, OnInit } from '@angular/core';
import io from "socket.io-client"
import { State } from "../model/State.model"
import { FormBuilder } from '@angular/forms';

@Component({
  selector: 'game-main',
  templateUrl: './game-main.component.html',
  styleUrls: ['./game-main.component.css']
})
export class GameMainComponent implements OnInit {

  private socket: any;
  public state: State = new State();
  public joinForm;
  public joined = false;
  public message = '';

  constructor(private formBuilder: FormBuilder) {
    this.joinForm = this.formBuilder.group({
      name: ''
    });
  }

  ngOnInit(): void {
    this.socket = io('/game');
    this.setEventListeners();
  }

  ngAfterInit() {
  }

  setEventListeners() {
    this.socket.on('update', data => {
      console.log('UPDATE');
      console.log(data);
      this.state = data;
    });
    this.socket.on('msg', data => {
      console.log('msg: ' + data);
    });
    this.socket.on('joined', state => {
      console.log('You have joined game');
      this.state = state;
      this.joined = true;
    });
    this.socket.on('winner', id => {
      console.log('WINNER: ' + id);
    });
  }

  startGame() {
    this.socket.emit('game-started');
  }

  join(name) {
    if (!this.state.gameStarted) {
      console.log('trying to join');
      this.socket.emit('join', name);
    } else {
      console.log('game already started');
    }
  }

  promptPlayer() {
    if (this.state.factors[0] == null
      && this.state.factors[1] == null) {
    }
  }

  registerBoardSelection(value: number) {
    this.registerFactorSub(this.state.factors);
    this.socket.emit('board-selection', value);
  }

  registerFactorSelection(factors: [number, number]) {
    this.state.factors = factors;
  }

  registerFactorSub(factors: [number, number]) {
    this.socket.emit('factor-selection', factors);
  }

  getPlayerWithId(id) {
    for (let i = 0; i < this.state.players.length; i++) {
      if (this.state.players[i].id == id) {
        return this.state.players[i];
      }
    }
    return null;
  }

  isCurrPlayer(id) {
    return this.getPlayerWithId(id) ? this.getPlayerWithId(id).isCurrPlayer : false;
  }

  currPlayer() {
    for (let i = 0; i < this.state.players.length; i++) {
      if (this.state.players[i].isCurrPlayer) {
        return this.state.players[i];
      }
    }
    return 'no current player';
  }

}

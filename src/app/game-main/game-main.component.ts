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
      this.setPrompt();
    });
    this.socket.on('msg', data => {
      console.log('msg: ' + data);
      this.message = data;
    });
    this.socket.on('joined', state => {
      this.state = state;
      this.joined = true;
    });
    this.socket.on('winner', id => {
      console.log('WINNER: ' + id);
    });
  }

  setPrompt() {
    if (this.winner()) {
      let winner = this.winner();
      this.message = `${winner.name} has won the game. Press 'Play Again' to start a new game.`
      return;
    }
    if (!this.state.gameStarted) { this.message = "Game Over. Press 'play again' to start new game."; return; }
    if (this.isCurrPlayer(this.socket.id)) {
      let currPlayer = this.getPlayerWithId(this.socket.id);
      if (currPlayer.isChoosingInitialFactors) {
        this.message = "Select any 2 factors on the factor line then select their product on the gameboard";
      } else {
        this.message = "You are the current player. Change one of the factors and mark the product on the board.";
      }
    } else {
      let currPlayer = this.currPlayer();
      this.message = `It is ${currPlayer.name}'s turn.`
    }

  }

  winner() {
    for (let player of this.state.players) {
      let id = player.id;
      if (this.isGameOver(id) && !this.isBoardFull()) {
        return player;
      }
    }
    return undefined;
  }

  isGameOver(id) {
    console.log(this.hasWin(id, 'horizontal'), this.hasWin(id, 'vertical'),
      this.hasWin(id, 'diagonal'), this.isBoardFull())
    if (this.hasWin(id, 'horizontal') || this.hasWin(id, 'vertical') ||
      this.hasWin(id, 'diagonal') || this.isBoardFull()) {
      return true;
    }
    return false;
  }

  isBoardFull() {
    for (let i = 0; i < this.state.markers.length; i++) {
      for (let j = 0; j < this.state.markers[0].length; j++) {
        if (this.state.markers[i][j] == '0') { return false }
      }
    }
    return true;
  }

  hasDiagonalWin(id) {
    for (let i = 0; i < this.state.markers.length - 3; i++) {
      for (let j = 0; j < this.state.markers[0].length - 3; j++) {
        let k = 0;
        while (k < 4) {
          if (this.state.markers[i + k][j + k] != id) {
            break;
          }
          k++;
        }
        if (k == 4) { return true; }
      }
    }
    for (let i = 0; i < this.state.markers.length - 3; i++) {
      for (let j = 2; j < this.state.markers[0].length; j++) {
        let k = 0;
        while (k < 4) {
          if (this.state.markers[i + k][j - k] != id) {
            break;
          }
          k++;
        }
        if (k == 4) { return true; }
      }
    }
    return false;
  }

  hasWin(id, orientation) {
    let horizontal;
    if (orientation == 'horizontal') {
      horizontal = true;
    } else if (orientation == 'vertical') {
      horizontal = false;
    } else if (orientation == 'diagonal') {
      return this.hasDiagonalWin(id);
    }
    for (let i = 0; i < this.state.markers.length; i++) {
      for (let j = 0; j < this.state.markers[0].length - 3; j++) {
        let k = 0;
        while (k < 4) {
          if (horizontal ? this.state.markers[i][j + k] != id
            : this.state.markers[j + k][i] != id) {
            break;
          }
          k++;
        }
        if (k == 4) { return true; }
      }
    }
    return false;
  }

  startGame() {
    this.socket.emit('game-started');
  }

  playAgain() {
    this.socket.emit('play-again');
  }

  join(name) {
    if (!this.state.gameStarted) {
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

  currPlayer() {
    for (let player of this.state.players) {
      if (this.isCurrPlayer(player.id)) {
        return this.getPlayerWithId(player.id)
      }
    }
    return undefined;
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

}

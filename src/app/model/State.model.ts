import { Player } from "./Player.model";

export class State {
  values: Array<Array<number>>;
  players: Array<Player>;
  factors: [number, number];
  markers: Array<Array<string>>;
  gameStarted: boolean;
  message: string;

  constructor() {
    this.values = [];
    this.players = [];
    this.factors = [null, null];
    this.markers = [];
    this.gameStarted = false;
    this.message = '';
  }
}
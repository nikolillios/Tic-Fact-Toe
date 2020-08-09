export class Player {
  id: string;
  color: string;
  name: string;
  isCurrPlayer: boolean;
  isChoosingInitialFactors: false;

  constructor(id: string, color: string) {
    this.id = id;
    this.name = name;
    this.color = color;
    this.isCurrPlayer = false;
    this.isChoosingInitialFactors = false;
  }

}
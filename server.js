//Install express server
const express = require('express');
const app = express();
const path = require('path');
const http = require('http');
const { stat } = require('fs');
const { setMaxListeners } = require('process');
const { getDefaultCompilerOptions } = require('typescript');
const server = require('http').createServer(app);
const io = require('socket.io')(server);


// Serve only the static files form the dist directory
app.use(express.static(__dirname + '/dist/Tic-Fact-Toe'));

app.get('/*', function (req, res) {

  res.sendFile(path.join(__dirname + '/dist/Tic-Fact-Toe/index.html'));
});

// Start the app by listening on the default Heroku port
server.listen(process.env.PORT || 4200, () => {
  console.log('listening');
});

var state = {
  values: [
    [1, 2, 3, 4, 5, 6],
    [7, 8, 9, 10, 12, 14],
    [15, 16, 18, 20, 21, 24],
    [25, 27, 28, 30, 32, 35],
    [36, 40, 42, 45, 48, 49],
    [54, 56, 63, 64, 72, 81]
  ],
  players: [],
  factors: [],
  markers: [
    ['0', '0', '0', '0', '0', '0'],
    ['0', '0', '0', '0', '0', '0'],
    ['0', '0', '0', '0', '0', '0'],
    ['0', '0', '0', '0', '0', '0'],
    ['0', '0', '0', '0', '0', '0'],
    ['0', '0', '0', '0', '0', '0']
  ],
  gameStarted: false,
  message: 'welcome, play the game',
}

const initState = state;

const game = io.of('/game');

game.on('connection', socket => {
  setListeners(socket);
});

function setListeners(socket) {
  // emit initial game state
  socket.on('join', (data) => {
    if (getPlayerWithId(socket.id) == null && !state.gameStarted) {
      // register new connection
      state.players.push({
        id: socket.id,
        name: data.name,
        color: getColor(),
        isCurrPlayer: false,
        isChoosingInitialFactors: false
      });
      printPlayers();
      game.emit('joined', state);
      state.message = 'You have connected';
    } else {
      game.emit('msg', 'error: you can not join');
    }
  });
  // game started
  socket.on('game-started', () => {
    console.log('game-started received')
    state.gameStarted = true;
    if (state.players.length > 0) {
      state.players[0].isCurrPlayer = true;
      state.players[0].isChoosingInitialFactors = true;
    }
    state.message = 'Game was started. Choose initial factors on the factor line'
    game.emit('update', state);
  });
  // board selection
  socket.on('board-selection', coordinate => {
    let row = coordinate[0];
    let col = coordinate[1];
    if (state.factors[0] * state.factors[1] == state.values[coordinate[0]][coordinate[1]]
      && isCurrPlayer(socket.id)) {
      state.markers[coordinate[0]][coordinate[1]] = socket.id;
      if (checkWin(socket.id)) {
        state.message = `${getPlayerWithId(socket.id).name} has won the game!`
      }
      changeCurrPlayer();
    }
    game.emit('update', state);
  });
  // factor selection
  socket.on('factor-selection', factors => {
    if (!isCurrPlayer(socket.id)) { return; }
    if (getPlayerWithId(socket.id).isChoosingInitialFactors) {
      state.factors = factors;
      getPlayerWithId(socket.id).isChoosingInitialFactors = false;
      state.message = `New factors are ${state.factors[0]} and ${state.factors[1]}`
    }
    if (shareOneElement(factors, state.factors) && !getPlayerWithId(socket.id).isChoosingInitialFactors) {
      state.factors = factors;
      state.message = `New factors are ${state.factors[0]} and ${state.factors[1]}`
    } else {
      state.message = `You can only change one of the previous factors 
      ${state.factors[0]} or ${state.factors[1]}`
    }
    game.emit('update', state);
  });
  // handle socket disconnect 
  socket.on('disconnect', () => {
    console.log('disconnecting');
    console.log(state);
    let player = getPlayerWithId(socket.id);
    let index = state.players.indexOf(player);
    state.players.splice(index, 1);
    removeMarkersOfId(socket.id);
    if (state.players.length == 0) {
      resetState();
      state.message = 'All players disconnected'
    }
    game.emit('update', state);
  });
}

function resetState() {
  state = {
    values: [
      [1, 2, 3, 4, 5, 6],
      [7, 8, 9, 10, 12, 14],
      [15, 16, 18, 20, 21, 24],
      [25, 27, 28, 30, 32, 35],
      [36, 40, 42, 45, 48, 49],
      [54, 56, 63, 64, 72, 81]
    ],
    players: [],
    factors: [],
    markers: [
      ['0', '0', '0', '0', '0', '0'],
      ['0', '0', '0', '0', '0', '0'],
      ['0', '0', '0', '0', '0', '0'],
      ['0', '0', '0', '0', '0', '0'],
      ['0', '0', '0', '0', '0', '0'],
      ['0', '0', '0', '0', '0', '0']
    ],
    gameStarted: false,
    message: 'welcome, play the game'
  };
}

function checkWin(id) {
  if (hasWin(id, 'horizontal') || hasWin(id, 'vertical') ||
    hasWin(id, 'diagonal')) {
    return true;
  }
}

function hasDiagonalWin(id) {
  for (let i = 0; i < state.markers.length - 3; i++) {
    for (let j = 0; j < state.markers[0].length - 3; j++) {
      let k = 0;
      while (k < 4) {
        if (state.markers[i + k][j + k] != id) {
          break;
        }
        k++;
      }
      if (k == 4) { return true; }
    }
  }
  for (let i = 0; i < state.markers.length - 3; i++) {
    for (let j = 2; j < state.markers[0].length; j++) {
      let k = 0;
      while (k < 4) {
        if (state.markers[i + k][j - k] != id) {
          break;
        }
        k++;
      }
      if (k == 4) { return true; }
    }
  }
  return false;
}

let colors = ['lightblue', 'lightgreen', 'red', 'orange'];
let colorInd = 0;
function getColor() {
  colorInd++;
  return colors[colorInd % 4];
}

function shareOneElement(tuple1, tuple2) {
  for (let i = 0; i < tuple1.length; i++) {
    for (let j = 0; j < tuple2.length; j++) {
      if (tuple1[i] == tuple2[j]) {
        return true;
      }
    }
  }
  return false;
}

function removeMarkersOfId(id) {
  for (let i = 0; i < state.markers.length; i++) {
    for (let j = 0; j < state.markers[0].length; j++) {
      if (state.markers[i][j] == id) {
        state.markers[i][j] = '0';
      }
    }
  }
}

function isCurrPlayer(id) {
  return getPlayerWithId(id) ? getPlayerWithId(id).isCurrPlayer : false;
}

function changeCurrPlayer() {
  if (state.players.length <= 1) { return; }
  let currInd = -1;
  for (let i = 0; i < state.players.length; i++) {
    if (state.players[i].isCurrPlayer) {
      currInd = i;
    }
  }
  state.players[currInd].isCurrPlayer = false;
  state.players[(currInd + 1) % state.players.length].isCurrPlayer = true;
}

function getPlayerWithId(id) {
  for (let i = 0; i < state.players.length; i++) {
    if (state.players[i].id == id) {
      return state.players[i];
    }
  }
  return null;
}

function printPlayers() {
  //print connection ids
  console.log('people: ');
  for (let i = 0; i < state.players.length; i++) {
    console.log(state.players[i].id);
  }
  console.log(state.markers);
}

function currPlayer() {
  for (let i = 0; i < state.players.length; i++) {
    if (state.players[i].isCurrPlayer) {
      return state.players[i];
    }
  }
  return 'no current player';
}

function hasWin(id, orientation) {
  let horizontal;
  if (orientation == 'horizontal') {
    horizontal = true;
  } else if (orientation == 'vertical') {
    horizontal = false;
  } else if (orientation == 'diagonal') {
    return hasDiagonalWin(id);
  }
  for (let i = 0; i < state.markers.length; i++) {
    for (let j = 0; j < state.markers[0].length - 3; j++) {
      let k = 0;
      while (k < 4) {
        if (horizontal ? state.markers[i][j + k] != id
          : state.markers[j + k][i] != id) {
          break;
        }
        k++;
      }
      if (k == 4) { return true; }
    }
  }
  return false;
}


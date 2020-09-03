//Install express server
const express = require('express');
const app = express();
const path = require('path');
const http = require('http');
const { stat } = require('fs');
const { setMaxListeners } = require('process');
const { getDefaultCompilerOptions, isShorthandPropertyAssignment } = require('typescript');
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
  markers: initMarkers(),
  gameStarted: false
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
        score: 0,
        isChoosingInitialFactors: false
      });
      socket.emit('joined', state);
      game.emit('update', state);
    } else {
      game.emit('msg', 'error: you can not join');
    }
  });
  // game started
  socket.on('game-started', () => {
    startGame();
  });
  socket.on('play-again', () => {
    resetPlayers();
    clearMarkersAndFactors();
    startGame();
    game.emit('update', state);
  })
  // board selection
  socket.on('board-selection', coordinate => {
    if (!isCurrPlayer(socket.id)) { return; }
    let row = coordinate[0];
    let col = coordinate[1];
    let player = getPlayerWithId(socket.id);
    if (state.factors[0] * state.factors[1] == state.values[row][col]) {
      if (state.markers[row][col] == '0') {
        state.markers[row][col] = socket.id;
      }
      if (isGameOver(socket.id)) {
        if (winner()) {
          winner().score++;
          resetPlayers();
        }
        state.gameStarted = false;
      } else {
        changeCurrPlayer();
      }
    }
    game.emit('update', state);
  });
  // factor selection
  socket.on('factor-selection', factors => {
    if (!isCurrPlayer(socket.id)) { return; }
    //initial factors
    if (getPlayerWithId(socket.id).isChoosingInitialFactors) {
      state.factors = factors;
      getPlayerWithId(socket.id).isChoosingInitialFactors = false;
    }

    if (shareOneElement(factors, state.factors) && !getPlayerWithId(socket.id).isChoosingInitialFactors) {
      state.factors = factors;
    } else {
    }
    game.emit('update', state);
  });
  // handle socket disconnect 
  socket.on('disconnect', () => {
    console.log('disconnecting');
    let player = getPlayerWithId(socket.id);
    let index = state.players.indexOf(player);
    state.players.splice(index, 1);
    removeMarkersOfId(socket.id);
    if (state.players.length == 0) {
      resetState();
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
    markers: initMarkers(),
    gameStarted: false
  };
}

function initMarkers() {
  return [
    ['0', '0', '0', '0', '0', '0'],
    ['0', '0', '0', '0', '0', '0'],
    ['0', '0', '0', '0', '0', '0'],
    ['0', '0', '0', '0', '0', '0'],
    ['0', '0', '0', '0', '0', '0'],
    ['0', '0', '0', '0', '0', '0']
  ]
}

function resetPlayers() {
  for (let player of state.players) {
    player.isChoosingInitialFactors = false;
    player.isCurrPlayer = false;
  }
}

function clearMarkersAndFactors() {
  state.markers = initMarkers();
  state.factors = [];
}

function startGame() {
  state.gameStarted = true;
  if (state.players.length > 0) {
    state.players[0].isCurrPlayer = true;
    state.players[0].isChoosingInitialFactors = true;
  }
  game.emit('update', state);
}

function winner() {
  for (let player of state.players) {
    let id = player.id;
    if (isGameOver(id) && !isBoardFull()) {
      return player;
    }
  }
  return undefined;
}

function isGameOver(id) {
  console.log(hasWin(id, 'horizontal'), hasWin(id, 'vertical'),
    hasWin(id, 'diagonal'), isBoardFull())
  if (hasWin(id, 'horizontal') || hasWin(id, 'vertical') ||
    hasWin(id, 'diagonal') || isBoardFull()) {
    return true;
  }
  return false;
}

function isBoardFull() {
  for (let i = 0; i < state.markers.length; i++) {
    for (let j = 0; j < state.markers[0].length; j++) {
      if (state.markers[i][j] == '0') { return false }
    }
  }
  return true;
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


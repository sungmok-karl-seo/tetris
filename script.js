// 테트리스 보드 크기
const COLS = 10;
const ROWS = 20;
const DROP_INTERVAL_MS = 800;

// 라인 삭제 점수 (한 번에 삭제한 줄 수)
const LINE_SCORES = {
  1: 100,
  2: 300,
  3: 500,
  4: 800,
};

// 블록 형태 정의 (1 = 블록이 있는 칸)
const PIECES = {
  I: { shape: [[1, 1, 1, 1]] },
  O: {
    shape: [
      [1, 1],
      [1, 1],
    ],
  },
  T: {
    shape: [
      [0, 1, 0],
      [1, 1, 1],
    ],
  },
  S: {
    shape: [
      [0, 1, 1],
      [1, 1, 0],
    ],
  },
  Z: {
    shape: [
      [1, 1, 0],
      [0, 1, 1],
    ],
  },
  J: {
    shape: [
      [1, 0, 0],
      [1, 1, 1],
    ],
  },
  L: {
    shape: [
      [0, 0, 1],
      [1, 1, 1],
    ],
  },
};

const PIECE_TYPES = Object.keys(PIECES);

// 블록 타입 → CSS 클래스
const PIECE_CSS_CLASSES = {
  I: "piece-i",
  O: "piece-o",
  T: "piece-t",
  S: "piece-s",
  Z: "piece-z",
  J: "piece-j",
  L: "piece-l",
};

const ALL_PIECE_CSS_CLASSES = Object.values(PIECE_CSS_CLASSES);

const GAME_KEYS = new Set(["ArrowLeft", "ArrowRight", "ArrowDown", "ArrowUp", " "]);

// DOM 요소
const menuScreen = document.getElementById("menu-screen");
const gameScreen = document.getElementById("game-screen");
const gameBoard = document.getElementById("game-board");
const scoreElement = document.getElementById("score");
const gameStatusElement = document.getElementById("game-status");
const menuStartBtn = document.getElementById("menu-start-btn");
const restartBtn = document.getElementById("restart-btn");
const controlButtons = document.querySelectorAll(".control-btn");

// 게임 상태
let score = 0;
let board = [];
let currentPiece = null;
let dropTimerId = null;
let isGameOver = false;

/**
 * CSS 그리드 크기를 JS 상수와 맞춥니다.
 */
function applyBoardCssVariables() {
  document.documentElement.style.setProperty("--board-cols", COLS);
  document.documentElement.style.setProperty("--board-rows", ROWS);
}

/**
 * shape 배열을 복사합니다.
 */
function copyShape(shape) {
  return shape.map((row) => [...row]);
}

/**
 * 빈 보드 배열을 만듭니다.
 */
function createEmptyBoard() {
  return Array.from({ length: ROWS }, () => Array(COLS).fill(0));
}

/**
 * 보드 좌표가 유효한지 확인합니다.
 */
function isInBounds(row, col) {
  return row >= 0 && row < ROWS && col >= 0 && col < COLS;
}

/**
 * 블록 shape의 채워진 칸마다 callback을 호출합니다. (경계 검사 없음)
 * @param {{ shape: number[][], row: number, col: number }} piece
 * @param {(boardRow: number, boardCol: number) => void} callback
 */
function forEachOccupiedCell(piece, callback) {
  const { shape, row, col } = piece;

  for (let r = 0; r < shape.length; r++) {
    for (let c = 0; c < shape[r].length; c++) {
      if (!shape[r][c]) {
        continue;
      }

      callback(row + r, col + c);
    }
  }
}

/**
 * 블록 shape에서 보드 안의 채워진 칸마다 callback을 호출합니다.
 * @param {{ shape: number[][], row: number, col: number }} piece
 * @param {(boardRow: number, boardCol: number) => void} callback
 */
function forEachBlockCell(piece, callback) {
  forEachOccupiedCell(piece, (boardRow, boardCol) => {
    if (isInBounds(boardRow, boardCol)) {
      callback(boardRow, boardCol);
    }
  });
}

/**
 * piece를 (dx, dy)만큼 이동했을 때 matrix 위에서 이동 가능한지 판정합니다.
 * @param {{ shape: number[][], row: number, col: number }} piece
 * @param {number} dx - 열 이동량
 * @param {number} dy - 행 이동량
 * @param {Array<Array<string|number>>} matrix - 고정 블록 보드
 */
function canMove(piece, dx, dy, matrix) {
  let canMoveResult = true;

  forEachOccupiedCell(piece, (boardRow, boardCol) => {
    if (!canMoveResult) {
      return;
    }

    const newRow = boardRow + dy;
    const newCol = boardCol + dx;

    if (!isInBounds(newRow, newCol) || matrix[newRow][newCol]) {
      canMoveResult = false;
    }
  });

  return canMoveResult;
}

/**
 * 고정 보드와 현재 블록을 합친 표시용 그리드를 만듭니다. (DOM 없음)
 * @returns {Array<Array<string|number>>}
 */
function buildDisplayGrid() {
  const grid = board.map((row) => [...row]);

  if (!currentPiece) {
    return grid;
  }

  forEachBlockCell(currentPiece, (boardRow, boardCol) => {
    grid[boardRow][boardCol] = currentPiece.type;
  });

  return grid;
}

/**
 * 셀에 블록 색상을 적용합니다.
 */
function setCellAppearance(cell, type) {
  cell.classList.remove("filled", ...ALL_PIECE_CSS_CLASSES);

  if (!type) {
    return;
  }

  const cssClass = PIECE_CSS_CLASSES[type];
  if (cssClass) {
    cell.classList.add("filled", cssClass);
  }
}

/**
 * 블록을 생성합니다.
 * @param {string} [type] - 블록 종류. 생략 시 랜덤.
 */
function createPiece(type) {
  let pieceType = type;

  if (!pieceType || !PIECES[pieceType]) {
    pieceType = PIECE_TYPES[Math.floor(Math.random() * PIECE_TYPES.length)];
  }

  const { shape } = PIECES[pieceType];

  return {
    type: pieceType,
    shape: copyShape(shape),
    row: 0,
    col: Math.floor((COLS - shape[0].length) / 2),
  };
}

/**
 * 표시용 그리드를 화면에 그립니다.
 */
function renderBoard() {
  const displayGrid = buildDisplayGrid();

  gameBoard.innerHTML = "";

  for (let row = 0; row < ROWS; row++) {
    for (let col = 0; col < COLS; col++) {
      const cell = document.createElement("div");
      cell.className = "cell";

      const cellType = displayGrid[row][col];
      if (cellType) {
        setCellAppearance(cell, cellType);
      }

      gameBoard.appendChild(cell);
    }
  }
}

/**
 * 현재 블록만 기존 보드 DOM 위에 다시 그립니다.
 * (이동·회전 등 부분 갱신 시 사용, 초기 표시는 renderBoard가 담당)
 */
function drawPiece() {
  if (!currentPiece || gameBoard.children.length === 0) {
    return;
  }

  const cells = gameBoard.children;

  forEachBlockCell(currentPiece, (boardRow, boardCol) => {
    const index = boardRow * COLS + boardCol;
    setCellAppearance(cells[index], currentPiece.type);
  });
}

/**
 * 현재 블록을 보드에 고정합니다.
 */
function lockPiece() {
  if (!currentPiece) {
    return;
  }

  const { type } = currentPiece;

  forEachOccupiedCell(currentPiece, (boardRow, boardCol) => {
    if (!isInBounds(boardRow, boardCol)) {
      return;
    }

    board[boardRow][boardCol] = type;
  });
}

/**
 * 고정 후 새 블록을 생성합니다.
 * @returns {boolean} 새 블록 배치 가능 여부
 */
function spawnPiece() {
  const piece = createPiece();

  if (!canMove(piece, 0, 0, board)) {
    currentPiece = null;
    return false;
  }

  currentPiece = piece;
  return true;
}

/**
 * 가득 찬 줄을 삭제하고 위 줄을 내립니다.
 * @returns {number} 삭제한 줄 수
 */
function clearLines() {
  let linesCleared = 0;

  for (let row = ROWS - 1; row >= 0; row--) {
    if (board.length !== ROWS) {
      break;
    }

    const isFull = board[row].every((cell) => cell !== 0);

    if (!isFull) {
      continue;
    }

    board.splice(row, 1);
    board.unshift(Array(COLS).fill(0));
    linesCleared += 1;
    row += 1;
  }

  return linesCleared;
}

/**
 * 삭제한 줄 수에 따라 점수를 더합니다.
 */
function addScore(linesCleared) {
  if (linesCleared === 0) {
    return;
  }

  const points = LINE_SCORES[linesCleared] ?? linesCleared * 100;
  score += points;
  updateScore();
}

/**
 * 블록을 고정하고 다음 블록을 생성합니다.
 */
function lockAndSpawnNext() {
  lockPiece();
  currentPiece = null;

  const linesCleared = clearLines();
  addScore(linesCleared);

  if (!spawnPiece()) {
    triggerGameOver();
  }
}

/**
 * 게임 오버 메시지를 표시합니다.
 */
function showGameOverMessage() {
  gameStatusElement.textContent = "게임 오버 — 재시작 버튼을 누르세요";
  gameStatusElement.classList.add("is-game-over");
}

/**
 * 게임 오버 상태로 전환합니다.
 */
function triggerGameOver() {
  stopGame();
  isGameOver = true;
  currentPiece = null;
  showGameOverMessage();
}

/**
 * 게임이 진행 중이고 조작 가능한 상태인지 확인합니다.
 */
function isGameActive() {
  return dropTimerId !== null && !isGameOver && currentPiece !== null;
}

/**
 * shape를 시계 방향 90도 회전합니다.
 */
function rotateShape(shape) {
  const rows = shape.length;
  const cols = shape[0].length;
  const rotated = Array.from({ length: cols }, () => Array(rows).fill(0));

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      rotated[c][rows - 1 - r] = shape[r][c];
    }
  }

  return rotated;
}

/**
 * 충돌 판정을 통과할 때만 블록을 이동합니다.
 */
function tryMovePiece(dx, dy) {
  if (!isGameActive()) {
    return false;
  }

  if (canMove(currentPiece, dx, dy, board)) {
    currentPiece.col += dx;
    currentPiece.row += dy;
    renderBoard();
    return true;
  }

  return false;
}

/**
 * 회전 후 충돌하면 회전을 취소합니다.
 */
function tryRotatePiece() {
  if (!isGameActive()) {
    return;
  }

  const rotatedShape = rotateShape(currentPiece.shape);
  const rotatedPiece = {
    ...currentPiece,
    shape: rotatedShape,
  };

  if (!canMove(rotatedPiece, 0, 0, board)) {
    return;
  }

  currentPiece.shape = rotatedShape;
  renderBoard();
}

/**
 * 한 칸 아래로 빠르게 내립니다.
 */
function softDrop() {
  dropPiece();
}

/**
 * 바닥까지 즉시 낙하한 뒤 블록을 고정합니다.
 */
function hardDrop() {
  if (!isGameActive()) {
    return;
  }

  while (canMove(currentPiece, 0, 1, board)) {
    currentPiece.row += 1;
  }

  lockAndSpawnNext();
  renderBoard();
}

/**
 * 메뉴 화면을 표시합니다.
 */
function showMenuScreen() {
  menuScreen.classList.add("is-active");
  menuScreen.hidden = false;
  gameScreen.classList.remove("is-active");
  gameScreen.hidden = true;
}

/**
 * 게임 화면을 표시합니다.
 */
function showGameScreen() {
  menuScreen.classList.remove("is-active");
  menuScreen.hidden = true;
  gameScreen.classList.add("is-active");
  gameScreen.hidden = false;
}

/**
 * 터치/버튼 조작을 처리합니다.
 */
function handleControlAction(action) {
  if (!isGameActive()) {
    return;
  }

  switch (action) {
    case "left":
      tryMovePiece(-1, 0);
      break;
    case "right":
      tryMovePiece(1, 0);
      break;
    case "down":
      softDrop();
      break;
    case "rotate":
      tryRotatePiece();
      break;
  }
}

/**
 * 터치 컨트롤 버튼을 등록합니다.
 */
function setupTouchControls() {
  controlButtons.forEach((button) => {
    button.addEventListener("click", (event) => {
      event.preventDefault();
      handleControlAction(button.dataset.action);
    });
  });
}

/**
 * 키보드 입력을 처리합니다.
 */
function handleKeyDown(event) {
  if (!GAME_KEYS.has(event.key)) {
    return;
  }

  event.preventDefault();

  if (!isGameActive()) {
    return;
  }

  switch (event.key) {
    case "ArrowLeft":
      tryMovePiece(-1, 0);
      break;
    case "ArrowRight":
      tryMovePiece(1, 0);
      break;
    case "ArrowDown":
      softDrop();
      break;
    case "ArrowUp":
      tryRotatePiece();
      break;
    case " ":
      hardDrop();
      break;
  }
}

/**
 * 키보드 이벤트를 한 번만 등록합니다.
 */
function setupKeyboardControls() {
  document.addEventListener("keydown", handleKeyDown);
}

/**
 * 현재 블록을 한 칸 아래로 내립니다. 충돌 시 고정 후 새 블록을 생성합니다.
 */
function dropPiece() {
  if (!currentPiece || isGameOver) {
    return;
  }

  if (canMove(currentPiece, 0, 1, board)) {
    currentPiece.row += 1;
    renderBoard();
    return;
  }

  lockAndSpawnNext();
  renderBoard();
}

/**
 * 자동 낙하 타이머를 시작합니다.
 */
function startGame() {
  if (dropTimerId !== null || isGameOver) {
    return;
  }

  dropTimerId = setInterval(dropPiece, DROP_INTERVAL_MS);
  setGameStatus("블록이 낙하 중입니다.");
}

/**
 * 자동 낙하 타이머를 중지합니다.
 */
function stopGame() {
  if (dropTimerId === null) {
    return;
  }

  clearInterval(dropTimerId);
  dropTimerId = null;
}

/**
 * 점수를 화면에 표시합니다.
 */
function updateScore() {
  scoreElement.textContent = score;
}

/**
 * 상태 메시지를 표시합니다.
 */
function setGameStatus(message) {
  gameStatusElement.textContent = message;
  gameStatusElement.classList.remove("is-game-over");
}

/**
 * 게임을 초기 상태로 되돌립니다.
 */
function initGame() {
  stopGame();
  isGameOver = false;
  score = 0;
  board = createEmptyBoard();
  currentPiece = createPiece();
  updateScore();
  setGameStatus("");
  gameStatusElement.classList.remove("is-game-over");
  renderBoard();
}

/**
 * 게임을 시작하고 화면을 전환합니다.
 */
function beginGame() {
  showGameScreen();
  initGame();
  startGame();
}

menuStartBtn.addEventListener("click", () => {
  beginGame();
});

restartBtn.addEventListener("click", () => {
  initGame();
  startGame();
});

applyBoardCssVariables();
setupKeyboardControls();
setupTouchControls();
initGame();

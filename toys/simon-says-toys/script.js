const toys = [
  { name: "Ball", emoji: "⚽" },
  { name: "Doll", emoji: "🪆" },
  { name: "Teddy", emoji: "🐻" },
  { name: "Train", emoji: "🚂" }
];

const actions = [
  { name: "Clap", emoji: "👏" },
  { name: "Stomp", emoji: "👢" },
  { name: "Turn around", emoji: "🔄" },
  { name: "Jump", emoji: "🤾" },
  { name: "Stand up", emoji: "🧍" },
  { name: "Sit down", emoji: "🪑" }
];

let timerSec = 4;
let mode = "basic";
let effectiveTimer = 4;

let isPlaying = false;
let nextRoundTimeout = null;
let commandTimeout = null;
let animationTimeout = null;

let round = 0;
let previousItem = null;

const timerInput = document.getElementById("timerInput");
const modeSelect = document.getElementById("modeSelect");
const startBtn = document.getElementById("startBtn");
const stopBtn = document.getElementById("stopBtn");

const itemBox = document.getElementById("itemBox");
const progressFill = document.getElementById("progressFill");
const commandBadge = document.getElementById("commandBadge");

const statusText = document.getElementById("statusText");
const roundNumber = document.getElementById("roundNumber");
const timerLabel = document.getElementById("timerLabel");

function randomFrom(array) {
  return array[Math.floor(Math.random() * array.length)];
}

function getAvailableItems() {
  let itemPool;

  if (mode === "basic") {
    itemPool = [...toys];
  } else if (mode === "actions") {
    itemPool = [...toys, ...actions];
  } else if (mode === "simonBob") {
    // Simon & Bob mode uses actions only.
    itemPool = [...actions];
  } else {
    // Hard mode uses toys and actions.
    itemPool = [...toys, ...actions];
  }

  // Prevent the same item appearing twice in a row.
  const differentItems = itemPool.filter((item) => {
    return !previousItem || item.name !== previousItem.name;
  });

  return differentItems.length > 0
    ? differentItems
    : itemPool;
}

function getNextItem() {
  const item = randomFrom(getAvailableItems());
  previousItem = item;
  return item;
}

function updateTimerLabel() {
  const selectedSeconds = Number(timerInput.value) || 4;

  const displayedSeconds =
    mode === "hard"
      ? selectedSeconds / 2
      : selectedSeconds;

  timerLabel.textContent = `${displayedSeconds} seconds`;
}

function resetProgressBar() {
  progressFill.style.transition = "none";
  progressFill.style.width = "0%";

  // Force the browser to notice the reset before starting the animation.
  void progressFill.offsetWidth;
}

function showCommand(isSimonSays) {
  commandBadge.hidden = false;

  if (isSimonSays) {
    commandBadge.textContent = "🧙 Simon Says";
    commandBadge.className = "command-badge simon";
    statusText.textContent = "Do the action!";
  } else {
    commandBadge.textContent = "🕶️ Bob Says";
    commandBadge.className = "command-badge bob";
    statusText.textContent = "Careful... don't move!";
  }
}

function hideCommand() {
  commandBadge.hidden = true;
  commandBadge.textContent = "";
  commandBadge.className = "command-badge";
}

function showNextItem() {
  if (!isPlaying) {
    return;
  }

  const item = getNextItem();
  const isSimonBobMode = mode === "simonBob";

  // Simon Says appears 75% of the time.
  const isSimonSays =
    !isSimonBobMode || Math.random() < 0.75;

  const commandDelay = isSimonBobMode ? 900 : 0;

  round++;
  roundNumber.textContent = round;

  clearTimeout(commandTimeout);

  if (isSimonBobMode) {
    showCommand(isSimonSays);
  } else {
    hideCommand();
    statusText.textContent = "Simon says...";
  }

  commandTimeout = setTimeout(() => {
    if (!isPlaying) {
      return;
    }

    itemBox.className = "";

    if (isSimonBobMode) {
      itemBox.classList.add(
        isSimonSays ? "simon-card" : "bob-card"
      );
    }

    itemBox.innerHTML = `
      <span>${item.emoji}</span>
      <span>${item.name}</span>
    `;

    itemBox.classList.remove("show");
    void itemBox.offsetWidth;
    itemBox.classList.add("show");

    clearTimeout(animationTimeout);

    animationTimeout = setTimeout(() => {
      itemBox.classList.remove("show");
    }, 600);

    resetProgressBar();

    progressFill.style.transition =
      `width ${effectiveTimer}s linear`;

    progressFill.style.width = "100%";

    scheduleNextRound();
  }, commandDelay);
}

function scheduleNextRound() {
  clearTimeout(nextRoundTimeout);

  nextRoundTimeout = setTimeout(() => {
    if (isPlaying) {
      showNextItem();
    }
  }, effectiveTimer * 1000);
}

function startGame() {
  timerSec = Math.max(
    1,
    Math.min(10, Number(timerInput.value) || 4)
  );

  timerInput.value = timerSec;
  mode = modeSelect.value;

  effectiveTimer =
    mode === "hard"
      ? timerSec / 2
      : timerSec;

  isPlaying = true;
  round = 0;
  previousItem = null;

  startBtn.disabled = true;
  stopBtn.disabled = false;
  timerInput.disabled = true;
  modeSelect.disabled = true;

  updateTimerLabel();
  showNextItem();
}

function stopGame() {
  isPlaying = false;

  clearTimeout(nextRoundTimeout);
  clearTimeout(commandTimeout);
  clearTimeout(animationTimeout);

  nextRoundTimeout = null;
  commandTimeout = null;
  animationTimeout = null;

  startBtn.disabled = false;
  stopBtn.disabled = true;
  timerInput.disabled = false;
  modeSelect.disabled = false;

  statusText.textContent = "Game stopped";

  resetProgressBar();

  hideCommand();

  itemBox.className = "";

  itemBox.innerHTML = `
    <span class="welcome-emoji">✨</span>
    <span class="welcome-text">Press start!</span>
  `;

  round = 0;
  previousItem = null;
  roundNumber.textContent = round;

  updateTimerLabel();
}

startBtn.addEventListener("click", startGame);
stopBtn.addEventListener("click", stopGame);

timerInput.addEventListener("input", updateTimerLabel);

modeSelect.addEventListener("change", () => {
  mode = modeSelect.value;
  updateTimerLabel();
});

document.addEventListener("keydown", (event) => {
  if (event.code === "Space") {
    event.preventDefault();

    if (isPlaying) {
      stopGame();
    } else {
      startGame();
    }
  }

  if (event.code === "Escape" && isPlaying) {
    stopGame();
  }
});

updateTimerLabel();

const WORLD_WIDTH = 100;
const WORLD_HEIGHT = 30;
const SPEED_SCALE_INCREASE = 0.000001;

let lastTime;
let speedScale;
let score;


const worldElem = document.querySelector("[data-world]");
const groundElems = document.querySelectorAll("[data-ground]");
const dinoElem = document.querySelector("[data-dino]");
const scoreElem = document.querySelector("[data-score]");
//const startScreenElem = document.querySelector("[data-start-screen]");

const SPEED = .035;

const CACTUS_INTERVAL_MIN = 1000;
const CACTUS_INTERVAL_MAX = 7000;


const JUMP_SPEED = 0.7;
const GRAVITY = 0.0025;
const DINO_FRAME_COUNT = 2;
const FRAME_TIME = 100;

let isJumping;
let dinoFrame;
let currentFrameTime;
let yVelocity;

var music = document.getElementById('music');
var looseMusic = document.getElementById('looseMusic');
var jumpMusic = document.getElementById('jumpMusic');


var instruction = document.getElementById('instruction');

console.log('50/60 Отсутсвует таблица с результатами 10 игр');

/*-----------SCALING THE GAME WINDOW-------------*/
function setPixelToWorldScale() {
  let worldToPixelScale
  if (window.innerWidth / window.innerHeight < WORLD_WIDTH / WORLD_HEIGHT) {
    worldToPixelScale = window.innerWidth / WORLD_WIDTH
  } else {
    worldToPixelScale = window.innerHeight / WORLD_HEIGHT
  }

  worldElem.style.width = `${WORLD_WIDTH * worldToPixelScale}px`;
  worldElem.style.height = `${WORLD_HEIGHT * worldToPixelScale}px`;
}


setPixelToWorldScale()
window.addEventListener("resize", setPixelToWorldScale)
document.addEventListener("keydown", handleStart, { once: true })

/*-----------UPDATE THE GAME STATUS-------------*/

function update(time) {
  if (lastTime == null) {
    lastTime = time
    window.requestAnimationFrame(update)
    music.src = `./audio/audio.mp3`;
    instruction.innerText = "Press \"Space\" to jump"
    return
  }
  const delta = time - lastTime

  updateGround(delta, speedScale)
  updateDino(delta, speedScale)
  updateCactus(delta, speedScale)
  updateSpeedScale(delta)
  updateScore(delta)
  if (checkLose()) return handleLose()
  lastTime = time
  window.requestAnimationFrame(update)
 
}

function checkLose() {
  const dinoRect = getDinoRect()
  return getCactusRects().some(rect => isCollision(rect, dinoRect))
}

function isCollision(rect1, rect2) {
  return (
    rect1.left < rect2.right &&
    rect1.top < rect2.bottom &&
    rect1.right > rect2.left &&
    rect1.bottom > rect2.top
  )
}

function updateSpeedScale(delta) {
  speedScale += delta * SPEED_SCALE_INCREASE
}

function updateScore(delta) {
  score += delta * 0.01
  scoreElem.textContent = Math.floor(score)
}

/*-----------START THE GAME-------------*/

function handleStart() {
  lastTime = null
  speedScale = 1
  score = 0
  setupGround()
  setupDino()
  setupCactus()
  //startScreenElem.classList.add("hide")
  window.requestAnimationFrame(update)
  music.src = "";
}

/*-----------HANDLE LOSE-------------*/

function handleLose() {
  music.src = "";
  looseMusic.src = `./audio/loose.mp3`;
  instruction.innerText = "You lose!!! Press any key to start"
  setDinoLose()
  setTimeout(() => {
    document.addEventListener("keydown", handleStart, { once: true })
    //startScreenElem.classList.remove("hide")
  }, 100)
}

//window.requestAnimationFrame(update);


/*-----------GROUND MOOVING-------------*/

function setupGround() {
  setCustomProperty(groundElems[0], "--left", 0)
  setCustomProperty(groundElems[1], "--left", 300)
}

function updateGround(delta, speedScale) {
  groundElems.forEach(ground => {
    incrementCustomProperty(ground, "--left", delta * speedScale * SPEED * -1)

    if (getCustomProperty(ground, "--left") <= -300) {
      incrementCustomProperty(ground, "--left", 600)
    }
  })
}

/*-----------HANDLE CUSTOM PROPERTIES-------------*/

function getCustomProperty(elem, prop) {
  return parseFloat(getComputedStyle(elem).getPropertyValue(prop)) || 0
}

function setCustomProperty(elem, prop, value) {
  elem.style.setProperty(prop, value)
}

function incrementCustomProperty(elem, prop, inc) {
  setCustomProperty(elem, prop, getCustomProperty(elem, prop) + inc)
}


/*-----------DINO MOOVING-------------*/
function setupDino() {
  isJumping = false
  dinoFrame = 0
  currentFrameTime = 0
  yVelocity = 0
  setCustomProperty(dinoElem, "--bottom", 0)
  document.removeEventListener("keydown", onJump)
  document.addEventListener("keydown", onJump)
}

 function updateDino(delta, speedScale) {
  handleRun(delta, speedScale)
  handleJump(delta)
}

 function getDinoRect() {
  return dinoElem.getBoundingClientRect()
}

 function setDinoLose() {
  dinoElem.src = "./img/dino-lose.png"
}

function handleRun(delta, speedScale) {
  if (isJumping) {
    dinoElem.src = `./img/dino-stationary.png`
    
    return
  }

  if (currentFrameTime >= FRAME_TIME) {
    dinoFrame = (dinoFrame + 1) % DINO_FRAME_COUNT
    dinoElem.src = `./img/dino-run-${dinoFrame}.png`
    currentFrameTime -= FRAME_TIME
    
  }
  currentFrameTime += delta * speedScale

}

/*-----------DINO JUMP-------------*/

function handleJump(delta) {
  if (!isJumping) return

  incrementCustomProperty(dinoElem, "--bottom", yVelocity * delta)

  if (getCustomProperty(dinoElem, "--bottom") <= 0) {
    setCustomProperty(dinoElem, "--bottom", 0)
    isJumping = false
  }

  yVelocity -= GRAVITY * delta
}

function onJump(e) {
  if (e.code !== "Space" || isJumping) return

  yVelocity = JUMP_SPEED
  isJumping = true
  jumpMusic.src = `./audio/jump.mp3`;
}


/*-----------CACTUS MOOVING-------------*/
let nextCactusTime
 function setupCactus() {
  nextCactusTime = CACTUS_INTERVAL_MIN
  document.querySelectorAll("[data-cactus]").forEach(cactus => {
    cactus.remove()
  })
}

 function updateCactus(delta, speedScale) {
  document.querySelectorAll("[data-cactus]").forEach(cactus => {
    incrementCustomProperty(cactus, "--left", delta * speedScale * SPEED * -1)
    if (getCustomProperty(cactus, "--left") <= -100) {
      cactus.remove()
    }
  })

  if (nextCactusTime <= 0) {
    createCactus()
    nextCactusTime =
      randomNumberBetween(CACTUS_INTERVAL_MIN, CACTUS_INTERVAL_MAX) / speedScale
  }
  nextCactusTime -= delta
}

 function getCactusRects() {
  return [...document.querySelectorAll("[data-cactus]")].map(cactus => {
    return cactus.getBoundingClientRect()
  })
}

function createCactus() {
  const cactus = document.createElement("img")
  cactus.dataset.cactus = true
  cactus.src = "./img/cactus.png"
  cactus.classList.add("cactus")
  setCustomProperty(cactus, "--left", 100)
  worldElem.append(cactus)
}

function randomNumberBetween(min, max) {
  return Math.floor(Math.random() * (max - min + 1) + min)
}

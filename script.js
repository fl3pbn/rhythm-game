"use strict";

const canvas = document.getElementById("game"),
  context = canvas.getContext("2d"),
  W = canvas.width,
  H = 430;
canvas.height = H;
const target = [3, 6, 8, 10, 12];
let running = false,
  showNumbers = true,
  beat = 0,
  score = 0,
  combo = 0,
  best = 0,
  lastHit = "";
let bpm = 110,
  nextBeat = 0,
  beatMs = 60000 / bpm,
  startedAt = 0,
  audio = null;
const center = { x: W / 2, y: 215 },
  R = 145;

function tone(freq, dur = 0.055, vol = 0.045) {
  if (!audio) return;
  const o = audio.createOscillator(),
    g = audio.createGain();
  o.frequency.value = freq;
  o.type = "sine";
  g.gain.value = vol;
  o.connect(g);
  g.connect(audio.destination);
  o.start();
  g.gain.exponentialRampToValueAtTime(0.001, audio.currentTime + dur);
  o.stop(audio.currentTime + dur);
}
function startGame() {
  if (!audio)
    audio = new (window.AudioContext || window.webkitAudioContext)();
  audio.resume();
  score = 0;
  combo = 0;
  lastHit = "";
  beat = 1;
  startedAt = performance.now();
  nextBeat = startedAt;
  running = true;
}
function reset() {
  running = false;
  score = 0;
  combo = 0;
  best = 0;
  lastHit = "";
  beat = 0;
  draw();
}
function currentBeat() {
  if (!running) return beat;
  return (Math.floor((performance.now() - startedAt) / beatMs) % 12) + 1;
}
function pulse(b) {
  // 12,3,6,8,10 are accented in the exercise
  const strong = target.includes(b);
  tone(strong ? 180 : 310, strong ? 0.12 : 0.045, strong ? 0.11 : 0.045);
}
function tap() {
  if (!running) return;
  const now = performance.now();
  const pos = (now - startedAt) / beatMs;
  const nearest = Math.round(pos);
  const diff = Math.abs(pos - nearest);
  // Beat 1 starts at game start.
  const b = (((nearest % 12) + 12) % 12) + 1;
  const tolerance = 0.25;
  if (diff <= tolerance) {
    const strong = target.includes(b);
    const pts = strong ? 100 : 30;
    score += pts;
    combo++;
    best = Math.max(best, combo);
    lastHit = diff < 0.12 ? "PERFECT!" : "GOOD";
  } else {
    combo = 0;
    lastHit = "MISS";
  }
}
window.addEventListener("keydown", (e) => {
  if (e.code === "Enter" && !running) {
    e.preventDefault();
    startGame();
    return;
  }
  if (e.code === "Space") {
    e.preventDefault();
    if (!running) startGame();
    else tap();
  }
});
canvas.addEventListener("pointerdown", tap);
document.getElementById("start").onclick = () => {
  startGame();
  document.getElementById("start").textContent = "▶ プレイ中";
};
document.getElementById("reset").onclick = reset;
document.getElementById("mode").onclick = () => {
  showNumbers = !showNumbers;
  document.getElementById("mode").textContent =
    "数字表示：" + (showNumbers ? "ON" : "OFF");
  draw();
};

function draw() {
  context.clearRect(0, 0, W, H);
  context.fillStyle = "#100a09";
  context.fillRect(0, 0, W, H);

  // header
  context.fillStyle = "#fff";
  context.font = "bold 20px system-ui";
  context.fillText("SCORE " + String(score).padStart(5, "0"), 24, 32);
  context.fillText("COMBO ×" + combo, 300, 32);
  context.fillText("BEST ×" + best, 590, 32);

  // rings
  context.strokeStyle = "#57372b";
  context.lineWidth = 2;
  context.beginPath();
  context.arc(center.x, center.y, R + 22, 0, Math.PI * 2);
  context.stroke();
  context.strokeStyle = "#2c1c17";
  context.beginPath();
  context.arc(center.x, center.y, R - 24, 0, Math.PI * 2);
  context.stroke();

  const active = currentBeat();
  for (let b = 1; b <= 12; b++) {
    const a = -Math.PI / 2 + (b * Math.PI * 2) / 12;
    const x = center.x + Math.cos(a) * R,
      y = center.y + Math.sin(a) * R;
    const strong = target.includes(b),
      isActive = running && active === b;
    if (isActive) {
      context.beginPath();
      context.arc(x, y, strong ? 33 : 27, 0, Math.PI * 2);
      context.fillStyle = strong ? "#d88b4d" : "#8c5d45";
      context.shadowBlur = 25;
      context.shadowColor = "#f0a56d";
      context.fill();
      context.shadowBlur = 0;
    }
    context.beginPath();
    context.arc(x, y, strong ? 25 : 18, 0, Math.PI * 2);
    context.fillStyle = strong ? "#b86b42" : "#51342a";
    context.fill();
    context.strokeStyle = strong ? "#f0b07b" : "#806052";
    context.lineWidth = 2;
    context.stroke();

    if (showNumbers) {
      context.fillStyle = "#fff";
      context.font = "bold 18px system-ui";
      context.textAlign = "center";
      context.textBaseline = "middle";
      context.fillText(b, x, y);
    }
  }
  context.textAlign = "center";
  context.textBaseline = "middle";
  context.fillStyle = "#fff";
  context.font = "bold 28px system-ui";
  context.fillText(running ? active : "12", center.x, center.y - 12);
  context.font = "16px system-ui";
  context.fillStyle = "#d4a58b";
  context.fillText("SOLeÁ", center.x, center.y + 18);

  // target guide
  context.font = "16px system-ui";
  context.fillStyle = "#d9b09a";
  context.fillText("強拍： 3   5   7   10", center.x, 365);
  context.font = "15px system-ui";
  context.fillStyle = lastHit === "MISS" ? "#ff806d" : "#f2c8a9";
  context.fillText(lastHit, center.x, 400);

  if (!running) {
    context.fillStyle = "#0009";
    context.fillRect(0, 45, W, 340);
    context.fillStyle = "#fff";
    context.font = "bold 34px system-ui";
    context.fillText("12拍のコンパスを練習しよう", center.x, 125);
    context.font = "19px system-ui";
    context.fillStyle = "#e0bba5";
    context.fillText("12・3・6・8・10 の強拍を狙って", center.x, 165);
    context.fillText("Space または画面クリック！", center.x, 195);
    context.font = "bold 24px system-ui";
    context.fillStyle = "#f0a56d";
    context.fillText("▶ スタートを押して開始", center.x, 245);
  }
}

function loop(t) {
  if (running) {
    const elapsed = Math.max(0, t - startedAt);
    const current = Math.floor(elapsed / beatMs);

    while (nextBeat <= t) {
      const beatNumber =
        (Math.floor((nextBeat - startedAt) / beatMs) % 12) + 1;
      pulse(beatNumber);
      nextBeat += beatMs;
    }

    beat = (current % 12) + 1;
  }
  draw();
  requestAnimationFrame(loop);
}
draw();
requestAnimationFrame(loop);

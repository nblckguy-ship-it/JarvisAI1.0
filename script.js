let currentMode = "normal";

const introAudio = document.getElementById("introAudio");
const hyperAudio = document.getElementById("hyperAudio");
const statusText = document.getElementById("statusText");
const waveform = document.getElementById("waveform");

function toggleMenu() {
  document.getElementById("menu").classList.toggle("open");
}

function setMode(mode) {
  if (currentMode === mode) return;

  currentMode = mode;
  document.body.setAttribute("data-mode", mode);

  if (mode === "hyper") {
    statusText.innerText = "JARVIS — HYPER MODE ENGAGED";
    hyperAudio.play();
    animateWave(true);
  } else {
    statusText.innerText = "JARVIS — NORMAL MODE ACTIVE";
    animateWave(false);
  }

  toggleMenu();
}

function playIntro() {
  introAudio.play();
  animateWave(true);

  introAudio.onended = () => {
    animateWave(false);
  };
}

function animateWave(active) {
  waveform.style.display = active ? "flex" : "none";
}

let listening = false;
let jarvisAwake = false;

const SpeechRecognition =
  window.SpeechRecognition || window.webkitSpeechRecognition;

const recognition = new SpeechRecognition();
recognition.lang = "en-US";
recognition.continuous = true;

recognition.onresult = (event) => {
  const text =
    event.results[event.results.length - 1][0].transcript.toLowerCase();

  console.log("Heard:", text);

  if (!jarvisAwake && text.includes("jarvis")) {
    jarvisAwake = true;
    speak("Yes sir. I am online.");
    setMode("hyper");
    return;
  }

  if (jarvisAwake) {
    sendToJarvis(text);
  }
};

function startListening() {
  if (listening) return;
  listening = true;
  recognition.start();
}

document.body.addEventListener("click", () => {
  startListening();
}, { once: true });

let memory = [];

async function sendToJarvis(text) {
  addWave(true);

  memory.push({ role: "user", content: text });

  const res = await fetch("/.netlify/functions/jarvis", {
    method: "POST",
    body: JSON.stringify({
      message: text,
      history: memory.slice(-10)
    })
  });

  const data = await res.json();

  memory.push({ role: "assistant", content: data.reply });

  speak(data.reply);
}

function speak(text) {
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.voice = speechSynthesis.getVoices()
    .find(v => v.name.includes("Google")) || null;

  utterance.rate = 0.9;
  utterance.pitch = 0.8;

  addWave(true);

  utterance.onend = () => addWave(false);

  speechSynthesis.speak(utterance);
}

function addWave(active) {
  document.getElementById("waveform").style.display =
    active ? "flex" : "none";
}
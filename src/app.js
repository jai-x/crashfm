import { gsap } from "gsap";
import stations from "./stations";
//import motds from "./motds.js";
import motds from "./motds_emoji.js";

const select = (str) => document.querySelector(str);
const selectAll = (str) => document.querySelectorAll(str);

const elemTrackStatic   = select("#track-static");
const elemTrackMusic    = select("#track-music");
const elemSplashLoading = select(".splash-loading");
const elemSplashStart   = select(".splash-start");
const elemNextButton    = select(".next-button");
const elemNowPlaying    = select(".now-playing");
const elemProgressBar   = select(".progress-bar");
const elemLogo          = select(".logo");
const elemBackground    = select(".background");
const elemTickerBody    = select(".ticker");
const elemTickerMove    = select(".ticker-move");
const elemTickerRows    = selectAll(".ticker-row");

let tracks = []
let unplayed = [];
let nowPlaying = null;
let progressAnim = null;
let loading = false;
let tickerAnim = null;

function loadMotds(motds) {
  const makeDiv = (cssClass, text) => {
    const e = document.createElement("div");
    e.classList.add(cssClass);
    const txt = document.createTextNode(text);
    e.appendChild(txt);
    return e;
  }

  shuffled = gsap.utils.shuffle(new Array(...motds));

  const elems0 = shuffled.reduce((e, m) => {
    e.push(makeDiv("ticker-message", m));
    e.push(makeDiv("ticker-gap", "•"));
    return e;
  }, []);
  const elems1 = elems0.map((e) => e.cloneNode(true));

  elemTickerRows[0].append(...elems0);
  elemTickerRows[1].append(...elems1);

  const widthTicker = elemTickerBody.offsetWidth;
  const widthRow = elemTickerRows[0].offsetWidth

  gsap.set(elemTickerMove, { x: widthTicker });

  const speed = 100;
  const durations = {
    init: widthTicker / speed,
    loop: widthRow / speed,
  };

  const tl = gsap.timeline({ paused: true });

  tl.to(elemTickerMove, {
    duration: durations.init,
    ease: 'linear',
    x: 0,
  });
  tl.to(elemTickerMove, {
    duration: durations.loop,
    ease: 'linear',
    x: -widthRow,
    repeat: -1,
  });

  tickerAnim = tl;
}

function updateBackgroundImage(elem, imgSrc) {
  const tl = gsap.timeline({paused: true});

  tl.to(elem, { opacity: 0, duration: 0.25 });
  tl.set(elem, { backgroundImage: `url(${imgSrc})` });
  tl.to(elem, { opacity: 1, duration: 0.25 });

  tl.play();
}

function loadStation(name) {
  const station = stations[name];

  updateBackgroundImage(elemLogo, station.logo);
  updateBackgroundImage(elemBackground, station.background);

  unplayed = [];
  tracks = station.tracks;
}

function start() {
  gsap.to(elemSplashStart, {
    opacity: 0,
    duration: 0.5,
    onComplete: () => { elemSplashStart.remove(); }
  });
  trackNext();
  tickerAnim.play();
}

function startProgress() {
  if (progressAnim) {
    return;
  }
  progressAnim = gsap.to(elemProgressBar, {
    width: "100%",
    ease: "linear",
    duration: elemTrackMusic.duration,
  });
}

function stopProgress() {
  if (!progressAnim) {
    return;
  }
  progressAnim.kill();
  progressAnim = null;
  gsap.set(elemProgressBar, { clearProps: "all" });
}

function setLoading() {
  loading = true;
  gsap.set(elemNextButton, { opacity: 0.5, cursor: "not-allowed" });
}

function stopLoading() {
  gsap.set(elemNextButton, { clearProps: "all" });
  loading = false;
}

function trackNext() {
  if (loading) {
    return;
  }

  setLoading();
  elemTrackMusic.pause();
  stopProgress();
  elemTrackStatic.play();

  elemNowPlaying.innerText = "Loading...";

  if (unplayed.length === 0) {
    unplayed = new Array(...tracks);
    unplayed = gsap.utils.shuffle(unplayed);
  }

  nowPlaying = unplayed.pop();

  elemTrackMusic.src = nowPlaying.path;
}

function trackPlay() {
  elemNowPlaying.innerText = `${nowPlaying.artist} - ${nowPlaying.title}`;
  elemTrackStatic.pause();
  elemTrackMusic.play();
  startProgress();
  setTimeout(stopLoading, 250); // prevents button spamming
}

function setup() {
  elemTrackMusic.addEventListener("canplay", () => { setTimeout(trackPlay, 1000); });
  elemTrackMusic.addEventListener("ended", trackNext);
  elemSplashStart.addEventListener("click", start);
  elemNextButton.addEventListener("click", trackNext);

  loadMotds(motds);
  loadStation("burnout3"); // default station

  elemSplashLoading.remove();
}

setup();

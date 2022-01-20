import { gsap } from "gsap";
import stations from "./stations.js";

const select = (str) => document.querySelector(str);

const elemTrackStatic   = select("#track-static");
const elemTrackMusic    = select("#track-music");
const elemSplashLoading = select(".splash-loading");
const elemSplashStart   = select(".splash-start");
const elemNextButton    = select(".next-button");
const elemNowPlaying    = select(".now-playing");
const elemProgressBar   = select(".progress-bar");
const elemLogo          = select(".logo");
const elemBackground    = select(".background");

let tracks = []
let unplayed = [];
let nowPlaying = null;
let progressAnim = null;
let loading = false;

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

  loadStation("burnout3"); // default station

  elemSplashLoading.remove();
}

setup();

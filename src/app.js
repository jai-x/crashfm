import m from 'mithril/hyperscript';
import mount from 'mithril/mount';
import redraw from 'mithril/redraw';
import gsap from 'gsap/index';

import stations from './stations';
import motds from './motds_emoji';

const shuffle = (array) => {
  const copy = new Array(...array);
  return copy.sort((a, b) => 0.5 - Math.random());
};

class CrashFM {
  station;
  started;
  loading;
  np;

  constructor(stations) {
    this.stations = stations;
    this.station = {};
    this.started = false;
    this.loading = true;
    this.np = {};
    this.unplayed = [];

    this.trackMusic = new Audio();
    this.trackMusic.autoplay = false;
    this.trackMusic.addEventListener('ended', this.loadNextTrack.bind(this));

    this.trackStatic = new Audio('/static/static.mp3');
    this.trackStatic.autoplay = false;
    this.trackStatic.loop = true;
  }

  start() {
    console.log(`${this.constructor.name}: start`);

    if (!this.station) {
      throw 'loadStation must be called first';
    }
    this.started = true;
    this.loadNextTrack();
  }

  loadStation(name) {
    console.log(`${this.constructor.name}: loadStation`);

    const newStation = this.stations[name];
    if(this.station === newStation) {
      return;
    }

    this.station = newStation;
    this.unplayed = [];
  }

  loadNextTrack() {
    console.log(`${this.constructor.name}: loadNextTrack`);

    this.loading = true;
    this.trackMusic.pause();
    this.trackStatic.play();

    if (this.unplayed.length === 0) {
      this.unplayed = shuffle(this.station.tracks);
    }
    this.np = this.unplayed.pop();

    this.trackMusic.addEventListener('canplay', () => {
      setTimeout(this.startNextTrack.bind(this), 500);
    }, { once: true })
    this.trackMusic.src = this.np.path;
    this.trackMusic.load();
  }

  startNextTrack() {
    console.log(`${this.constructor.name}: startNextTrack`);

    this.trackStatic.pause();
    this.trackMusic.play();
    this.loading = false;
    redraw();
  }

  get progress() {
    if (this.loading) {
      return 0;
    }
    return ((this.trackMusic.currentTime / this.trackMusic.duration) * 100).toFixed(2);
  }
};

class Background {
  view(vnode) {
    return m('img.background', { src: vnode.attrs.background });
  }

  oncreate(vnode) {
    gsap.fromTo(vnode.dom, { opacity: 0 }, { opacity: 1, duration: 0.25 });
  }

  onbeforeremove(vnode) {
    return gsap.to(vnode.dom, { opacity: 0, duration: 0.25 }).then();
  }
};

class Logo {
  view(vnode) {
    return m('.logo-container', [
      m('img.logo', { src: vnode.attrs.logo }),
    ]);
  }

  oncreate(vnode) {
    gsap.fromTo(vnode.dom, { opacity: 0 }, { opacity: 1, duration: 0.25 });
  }

  onbeforeremove(vnode) {
    return gsap.to(vnode.dom, { opacity: 0, duration: 0.25 }).then();
  }
}

class Splash {
  view(vnode) {
    return m('.splash', { onclick: () => cfm.start() }, [
      m('span', 'Click anywhere to begin'),
    ]);
  }

  onbeforeremove(vnode) {
    return gsap.to(vnode.dom, { opacity: 0, duration: 1 }).then();
  }
}

class Info {
  view(vnode) {
    const { np, loading } = vnode.attrs;
    const text = (loading ? 'Loading...' : `${np.artist} - ${np.title}`);
    const buttonClass = `next-button ${(loading ? 'next-button-loading' : '')}`;

    return m('.info', [
      m('.now-playing', text),
      m('img',  {
        class: buttonClass,
        src: '/static/next.png',
        onclick: () => cfm.loadNextTrack(),
      }),
    ]);
  }
}

class Progress {
  view(vnode) {
    const { loading, progress } = vnode.attrs;

    if (!loading) {
      setTimeout(m.redraw, 200);
    }

    return m('.progress', [
      m('.progress-bar', { style: { width: `${vnode.attrs.progress}%` }}),
    ]);
  }
}

class TickerRow {
  view(vnode) {
    const messages = vnode.attrs.messages;

    return m('.ticker-row', ...messages.map((message) => {
      return [ m('.ticker-message', message), m('.ticker-gap', '•') ];
    }));
  }
}

class Ticker {
  oninit() {
    this.moving = false;
  }

  view(vnode) {
    const messages = vnode.attrs.messages;
    return m('.ticker', [
      m('.ticker-move', [
        m(TickerRow, { messages }),
        m(TickerRow, { messages }),
      ]),
    ]);
  }

  onupdate(vnode) {
    if (!this.moving && vnode.attrs.started) {
      this.animation.play();
    }
  }

  oncreate(vnode) {
    const speed = 225; // pixels/second ???
    const frame = vnode.dom;
    const frameWidth = frame.offsetWidth;
    const move = vnode.dom.firstChild;
    const rowWidth = move.firstChild.offsetWidth;

    gsap.set(move, { x: frameWidth });

    const tl = gsap.timeline({ paused: true });
    tl.to(move, { x: 0, duration: frameWidth / speed, ease: 'linear' });
    tl.to(move, { x: -rowWidth, duration: rowWidth / speed, ease: 'linear', repeat: -1 });
    this.animation = tl;
  }
}

class Main {
  view(vnode) {
    const { started, loading, np, progress, station: { background, logo } } = vnode.attrs.cfm;
    const messages = vnode.attrs.messages;

    return m('main', [
      [
        m(Background, { background, key: background }),
      ],
      m('.content', [
        m('.selector', [
          m(Logo, { logo, key: logo }),
        ]),
        m(Progress, { loading, progress }),
        m(Info, { np, loading }),
        m(Ticker, { messages, started }),
      ]),
      (!started ? m(Splash) : ''),
    ]);
  }
};

const cfm = new CrashFM(stations);
const messages = shuffle(motds);

cfm.loadStation('burnout3');

document.addEventListener('DOMContentLoaded', () => {
  mount(document.body, { view: () => m(Main, { cfm, messages }) });
});

import m from 'mithril/hyperscript';
import mount from 'mithril/mount';
import redraw from 'mithril/redraw';
import gsap from 'gsap/index';

import { shuffle } from './utils';

import stations from './stations';
import motds from './motds_emoji';

class CrashFM {
  station;
  stations;
  started;
  loading;
  selecting;
  np;

  constructor(stations) {
    this.stations = stations;
    this.station = {};
    this.started = false;
    this.loading = true;
    this.selecting = false;
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
    if (!newStation ) {
      return false;
    }

    if(this.station.key === newStation.key) {
      return false;
    }

    this.station = newStation;
    this.unplayed = [];
    console.log(`${this.constructor.name}: loadStation: loaded new station (${newStation.key})`);
    return true;
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

  startSelect() {
    console.log(`${this.constructor.name}: startSelect`);
    if (this.selecting) {
      return;
    }
    this.selecting = true;
  }

  stopSelect() {
    console.log(`${this.constructor.name}: stopSelect`);
    if (!this.selecting) {
      return;
    }
    this.selecting = false;
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
    return m('img.logo', { src: vnode.attrs.logo });
  }

  oncreate(vnode) {
    gsap.fromTo(vnode.dom, { opacity: 0 }, { opacity: 1, duration: 0.25 });
  }

  onbeforeremove(vnode) {
    return gsap.to(vnode.dom, { opacity: 0, duration: 0.5 }).then();
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
      setTimeout(redraw, 200);
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

class World {
  view() {
    return m('.world-row', [
      m('img.world-img', { src: '/static/world.png' }),
      m('span.world-text', [
        m('b', 'CrashFM.live')
      ]),
    ]);
  }
}

class CarouselScroll {
  onint(vnode) {
    const { station: { key } } = vnode.attrs;
    this.activeStationKey = key;
    this.scrollTimer = null;
    this.shouldSelect = false;
  }

  view(vnode) {
    const { stations } = vnode.attrs;
    return m('.carousel-scroll', [
      m('.carousel-gap'),
      Object.entries(stations).map(([_, s]) =>
        m('img.carousel-logo', { key: s.logo, src: s.logo })
      ),
      m('.carousel-gap'),
    ]);
  }

  oncreate(vnode) {
    this.updateScroll(vnode);

    const { stations } = vnode.attrs;

    const onScrollStop = () => {
      if (!this.shouldSelect) {
        return;
      }

      const scrollCoords = vnode.dom.getBoundingClientRect();
      const scrollMiddle = scrollCoords.y + scrollCoords.height / 2;

      const selectIndex = this.scrollChildren(vnode).findIndex(elem => {
        const elemCoords = elem.getBoundingClientRect();
        return scrollMiddle > elemCoords.y && scrollMiddle < elemCoords.y + elemCoords.height;
      });

      const newStationKey = Object.keys(stations)[selectIndex];
      if (cfm.loadStation(newStationKey)) {
        cfm.loadNextTrack();
      }
    };

    const onScrollStart = () => {
      if (this.scrollTimer) {
        clearTimeout(this.scrollTimer);
      }
      this.scrollTimer = setTimeout(onScrollStop, 150);
    };

    vnode.dom.addEventListener('scroll', onScrollStart);
  }

  onupdate(vnode) {
    this.shouldSelect = vnode.attrs.selecting;
    this.updateScroll(vnode);
  }

  scrollChildren(vnode) {
    // more than two padding + 1 elem
    if (vnode.dom.children.length < 4) {
      return [];
    }
    const ch = Array.from(vnode.dom.children);
    ch.pop();
    ch.shift();
    return ch;
  }

  updateScroll(vnode) {
    const { station: { key }, stations } = vnode.attrs;
    if (this.activeStationKey === key) {
      return;
    }
    this.activeStationKey = key;
    const i = Object.keys(stations).findIndex((s) => this.activeStationKey === s);
    this.scrollChildren(vnode)[i].scrollIntoView({block: 'center'});
  }
}

class Carousel {
  oninit(vnode) {
    this.lastSelecting = false;
  }

  view(vnode) {
    const { selecting, station, stations } = vnode.attrs;
    return m('.carousel', { onclick: (e) => { e.stopPropagation(); cfm.stopSelect(); } }, [
      m(CarouselScroll, { selecting, station, stations }),
      m('.carousel-line.left'),
      m('.carousel-line.right'),
    ]);
  }

  oncreate(vnode) {
    gsap.set(vnode.dom, { autoAlpha: 0 });
  }

  onupdate(vnode) {
    const { selecting } = vnode.attrs;
    if (this.lastSelecting === selecting) {
      return;
    }
    this.lastSelecting = selecting;
    if (selecting) {
      gsap.to(vnode.dom, { autoAlpha: 1, ease: 'out.power4', duration: 0.25 });
    } else {
      gsap.to(vnode.dom, { autoAlpha: 0, ease: 'out.power4', duration: 0.5 });
    }
  }
}

class Main {
  view(vnode) {
    const {
      cfm: { station, stations, started, loading, selecting, np, progress },
      messages,
    } = vnode.attrs;

    return m('main', [
      [ m(Background, { background: station.background, key: station.key }) ],
      m('.content', [
        m('.selector', { onclick: () => cfm.startSelect() }, [
          m(World),
          [ !selecting ? m(Logo, { logo: station.logo, key: station.key }) : '' ],
          m(Carousel, { selecting, stations, station }),
        ]),
        m(Progress, { loading, progress }),
        m(Info, { np, loading }),
        m(Ticker, { messages, started }),
      ]),
      [ !started ? m(Splash) : '' ],
    ]);
  }
};

const cfm = new CrashFM(stations);
const messages = shuffle(motds);

cfm.loadStation(Object.keys(stations)[0]);

document.addEventListener('DOMContentLoaded', () => {
  mount(document.body, { view: () => m(Main, { cfm, messages }) });
});

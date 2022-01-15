import { gsap } from "gsap";

function changeBackground(url) {
  const cssUrl = `url(${url})`;
  const tl = gsap.timeline({ paused: true });

  tl.set("#bg-front", { display: 'block', opacity: 1 });
  tl.set("#bg-back", { backgroundImage: cssUrl });
  tl.to("#bg-front", { opacity: 0, duration: 1 });
  tl.set("#bg-front", { display: 'none', backgroundImage: cssUrl });

  tl.play();
}

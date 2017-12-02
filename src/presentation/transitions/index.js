import { easeInOutQuad } from '../../utils/css-ease.js';

export function fade({
  duration = 600,
  easing = easeInOutQuad
}={}) {
  return async function(slide) {
    await slide.synchronize();

    const anim = slide.animate([
      {opacity: 0},
      {opacity: 1}
    ], {
      duration,
      easing,
      fill: 'forwards'
    });

    return anim.finished;
  }
}

export function fadeBlank({
  duration = 600,
  easing = easeInOutQuad,
  color = 'black'
}={}) {
  return async function(slide, exitingSlide, stage) {
    const blank = document.createElement('div');

    Object.assign(blank.style, {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      opacity: 0,
      backgroundColor: color
    });

    stage.append(blank);

    await slide.synchronize(blank.animate([
      { opacity: 0 },
      { opacity: 1 },
    ], {
      duration,
      easing,
      fill: 'forwards'
    }).finished);

    slide.style.opacity = 1;

    await blank.animate([
      {opacity: 1},
      {opacity: 0},
    ], {
      duration,
      easing,
      fill: 'forwards'
    }).finished;

    blank.remove();
  }
}

function slideFrom(direction, {
  duration = 800,
  easing = easeInOutQuad
}={}) {
  return async function(slide, exitingSlide, stage) {
    await slide.synchronize();

    slide.style.opacity = 1;

    slide.animate([
      { transform: `translateX(${direction == 'right' ? 100 : -100}%)` },
      { transform: 'none' },
    ], { duration, easing });

    await exitingSlide.animate([
      { transform: 'none' },
      { transform: `translateX(${direction == 'right' ? -100 : 100}%)` }
    ], { duration, easing }).finished;
  }
}

export function slideFromRight(opts) {
  return slideFrom('right', opts);
}

export function slideFromLeft(opts) {
  return slideFrom('left', opts);
}

export function swap() {
  return async function(slide) {
    await slide.synchronize();
    slide.style.opacity = 1;
  }
}

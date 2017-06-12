/** @jsx h */
import { h } from '../../utils/dom.js';
import { easeInOutQuad } from '../../utils/css-ease.js';

export function fade({
  duration = 600,
  easing = easeInOutQuad
}={}) {
  return async function(slide) {
    await slide.currentSynchronized();

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
    const blank = <div/>;

    Object.assign(blank.style, {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      opacity: 0,
      backgroundColor: color
    });

    const fadeInAnim = blank.animate([
      {opacity: 0},
      {opacity: 1},
    ], {
      duration,
      easing,
      fill: 'forwards'
    });

    fadeInAnim.pause();

    stage.append(blank);

    const slideReady = await slide.currentSynchronized();

    slide.synchronize(fadeInAnim.finished);

    await slideReady;

    fadeInAnim.play();

    await fadeInAnim.finished;

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
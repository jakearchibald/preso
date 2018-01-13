import {easeInOutQuad, easeOutQuint} from '../css-ease';
import {getRelativeBoundingClientRect} from '../dom';

export async function fadeIn(element, {
  duration = 500,
  easing = easeInOutQuad
}={}) {
  const slide = element.closest('preso-slide');
  if (!slide) throw Error("Fading element must be within preso-slide");

  const currentStyleValue = element.style.opacity;
  const currentOpacity = getComputedStyle(element).opacity;
  const endOpacity = parseFloat(currentOpacity) < 0.01 ? '1' : '';

  element.style.opacity = '0.0001';

  await slide.synchronize();

  if (currentStyleValue && currentStyleValue !== '0') {
    element.style.opacity = currentStyleValue;
  }
  else {
    element.style.opacity = endOpacity;
  }

  await element.animate([
    { opacity: '0' },
    { opacity: endOpacity || currentOpacity }
  ], {
    duration: duration * slide.transition,
    easing
  }).finished;
}

export async function fadeOut(element, {
  duration = 500,
  easing = easeInOutQuad
} = {}) {
  const slide = element.closest('preso-slide');
  if (!slide) throw Error("Fading element must be within preso-slide");

  await slide.synchronize();

  return element.animate([
    { opacity: 1 },
    { opacity: 0 }
  ], {
    duration: duration * slide.transition,
    easing,
    fill: 'forwards'
  }).finished;
}

export async function sizeOut(element, {
  duration = 500,
  easing = easeInOutQuad,
  direction = 'xy'
} = {}) {
  const slide = element.closest('preso-slide');
  if (!slide) throw Error("Fading element must be within preso-slide");

  const end = {};

  if (direction.includes('x')) {
    end.width = '0';
  }
  if (direction.includes('y')) {
    end.height = '0';
  }

  await slide.synchronize();

  const style = getComputedStyle(element);

  await element.animate([
    {width: style.width, height: style.height},
    end
  ], {
    duration: duration * slide.transition,
    easing,
    fill: 'forwards'
  }).finished;

  element.style.opacity = '0';
}

export async function slideFrom(pos, element, {
  duration = 500,
  easing = easeOutQuint
} = {}) {
  const slide = element.closest('preso-slide');
  if (!slide) throw Error("Fading element must be within preso-slide");

  const from = {};
  const opacity = element.style.opacity;

  element.style.opacity = '0.0001';

  await slide.synchronize();

  const box = getRelativeBoundingClientRect(element, slide);
  let currentTransform = getComputedStyle(element).transform;

  if (currentTransform === 'none') currentTransform = '';

  element.style.opacity = opacity;

  if (pos == 'top') {
    from.transform = `translateY(${-box.top - box.height}px) ${currentTransform}`;
  }
  else if (pos == 'bottom') {
    from.transform = `translateY(${slide.offsetHeight - box.top}px) ${currentTransform}`;
  }
  else if (pos == 'left') {
    from.transform = `translateX(${-box.left - box.width}px) ${currentTransform}`;
  }
  else if (pos == 'right') {
    from.transform = `translateX(${slide.offsetWidth - box.left}px) ${currentTransform}`;
  }

  await element.animate([
    from,
    { transform: currentTransform }
  ], {
    duration: duration * slide.transition,
    easing,
  }).finished;
}

export function animWatcher(element) {
  new MutationObserver(records => {
    for (const {addedNodes} of records) {
      for (const node of addedNodes) {
        if (node.nodeType != 1) continue;

        // fade-in
        if (node.hasAttribute('fade-in')) {
          node.removeAttribute('fade-in');
          const opts = {};

          if (node.hasAttribute('fade-duration')) {
            opts.duration = Number(node.getAttribute('fade-duration'));
            node.removeAttribute('fade-duration')
          }

          if (node.hasAttribute('fade-easing')) {
            opts.easing = node.getAttribute('fade-easing');
            node.removeAttribute('fade-easing')
          }

          fadeIn(node, opts);
        }
      }
    }
  }).observe(element, {
    childList: true,
    subtree: true
  });
}

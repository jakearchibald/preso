import {easeInOutQuad} from '../css-ease';

export async function fadeIn(element, {
  duration = 500,
  easing = easeInOutQuad
}={}) {
  const slide = element.closest('preso-slide');
  if (!slide) throw Error("Fading element must be within preso-slide");
  
  element.style.opacity = 0.0001;

  await slide.synchronize();

  element.style.opacity = '';
  
  return element.animate([
    {opacity: 0.0001},
    {opacity: 1}
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
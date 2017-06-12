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
  
  element.animate([
    {opacity: 0.0001},
    {opacity: 1}
  ], {
    duration, easing
  }).finished;
}

export function animWatcher(element) {
  new MutationObserver(records => {
    for (const {addedNodes} of records) {
      for (const node of addedNodes) {
        if (node.nodeType == 1 && node.hasAttribute('fade-in')) {
          fadeIn(node);
        }
      }
    }
  }).observe(element, {
    childList: true,
    subtree: true
  });
}
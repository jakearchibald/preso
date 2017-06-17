import Slide from './';
import TimelineLite from 'gsap/TimelineLite.js';

Slide.prototype.timeline = function() {
  const timeline = new TimelineLite({
    onUpdate: () => {
      if (!this.transition) {
        timeline.progress(1, false);
      }
    }
  });

  return timeline;
};
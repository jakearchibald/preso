import Slide from './';
import TimelineLite from 'gsap/TimelineLite';
import 'gsap/CSSPlugin.js';

Slide.prototype.timeline = function() {
  const timeline = new TimelineLite({
    onUpdate: () => {
      if (!this.transition) {
        if (timeline.duration() !== 0) {
          timeline.progress(1, false);
        }
      }
    }
  });

  return timeline;
};

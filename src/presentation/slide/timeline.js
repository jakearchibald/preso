import Slide from './';
import TimelineLite from 'gsap/src/uncompressed/TimelineLite.js';
import 'gsap/src/uncompressed/plugins/CSSPlugin.js';
import 'gsap/src/uncompressed/easing/EasePack.js';

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

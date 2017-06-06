import Presentation from '../src/presentation/index.js';
import {fadeBlank} from '../src/presentation/transitions/index.js';
import {findTexts} from '../src/utils/dom.js';
const presentation = document.createElement('preso-presentation');
document.body.append(presentation);

function wait(ms) {
  return new Promise(r => setTimeout(r, ms));
}

presentation.slide(async slide => {
  slide.append('Hello!');
  presentation.notes.set(`
    Hello
    World
    These are my notes
    And here are some more
  `);
  await slide.next();
  slide.append('World!');
});

presentation.transition(fadeBlank());

presentation.slide(async slide => {
  slide.prepare(wait(5000));
  slide.append('Second slide');
});

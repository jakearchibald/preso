/** @jsx h */
import Presentation from '../src/presentation';
import Img from '../src/img';
import {fadeBlank} from '../src/presentation/transitions';
import {findTexts} from '../src/utils/dom';
import {fadeIn} from '../src/utils/anims';
const presentation = document.createElement('preso-presentation');
document.body.append(presentation);

function wait(ms) {
  return new Promise(r => setTimeout(r, ms));
}

const notes = (...args) => presentation.notes.set(...args);

presentation.slide('This is my first slide', async slide => {
  slide.append('Hello!');
  
  notes(`
    Hello
    World
    These are my notes
    And here are some more
  `);

  presentation.notes.startTimer();

  await slide.next();

  notes(`
    Some more notes
  `);

  //const world = <div style="opacity: 0">World!</div>;

  slide.append(
    <div fade-in>
      world
      <preso-img src="imgs/1.png" class="img-1"/>
      <preso-img src="imgs/2.png" class="img-2"/>
      <preso-img src="imgs/3.png" class="img-3"/>
    </div>
  );
});

presentation.transition(fadeBlank());

presentation.slide(async slide => {
  slide.append('Second slide');
});

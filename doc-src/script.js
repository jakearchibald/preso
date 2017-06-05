import Presentation from '../src/presentation/index.js';
import {fadeBlank} from '../src/presentation/transitions/index.js';
import {findTexts} from '../src/utils/dom.js';
const presentation = new Presentation();
//document.body.append(presentation);

function wait(ms) {
  return new Promise(r => setTimeout(r, ms));
}

presentation.slide(async slide => {
  slide.append('Hello!');
  await slide.next();
  slide.append('World!');
});

presentation.transition(fadeBlank());

presentation.slide(async slide => {
  slide.prepare(wait(5000));
  slide.append('Second slide');
});

for (const range of [...findTexts('TP')]) {
  const span = document.createElement('span');
  span.style.background = 'red';
  span.appendChild(range.extractContents());
  range.insertNode(span);
}
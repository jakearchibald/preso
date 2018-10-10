/**
 * @returns Range
 */
export function findText(str, opts={}) {
  const {index = 0} = opts;
  let i = 0;

  for (const range of findTexts(str, opts)) {
    if (i === index) return range;
    i++;
  }
}

/**
 * @example Wrap every instance of 'hello' in a span:
 * for (const range of [...findTexts('hello')]) {
 *   const span = document.createElement('span');
 *   span.appendChild(range.extractContents());
 *   range.insertNode(span);
 * }
 */
export function* findTexts(str, {
  root = document.body
}={}) {
  let matchPos = 0;
  let startContainer = null;
  let rewindCount = 0;
  let startOffset = 0;

  const ittr = document.createNodeIterator(root, NodeFilter.SHOW_TEXT);

  while (true) {
    let textNode = ittr.nextNode();
    if (!textNode) return;

    let text = textNode.nodeValue;

    // This lets us rewind if we don't find a match
    if (matchPos) rewindCount++;

    for (let i = 0; i < text.length; i++) {
      if (text[i] == str[matchPos]) {
        // Possible match
        if (matchPos == 0) {
          startContainer = textNode;
          startOffset = i;
        }

        matchPos++;

        // Total match
        if (matchPos == str.length) {
          const range = document.createRange();
          range.setStart(startContainer, startOffset);
          range.setEnd(textNode, i + 1);

          yield range;

          matchPos = 0;
          startContainer = null;
          startOffset = 0;
          rewindCount = 0;
        }
      }
      // Match failure
      else if (matchPos) {
        // Rewind everything to the first character of the initial match & continue
        while (rewindCount) {
          textNode = ittr.previousNode();
          rewindCount--;
        }
        text = textNode.nodeValue;
        i = startOffset;
        matchPos = 0;
        startContainer = null;
        startOffset = 0;
      }
    }
  }
}

const localStorageKeyPrefix = 'are-you-there-';

export function createDetectableWindow(name) {
  const win = window.open('', name,
    'menubar=no,toolbar=no,location=no,status=no'
  );

  // Empty previous contents
  win.document.open();
  // Listen for "are you there?" requests
  win.document.write(`
    <script>
      window.addEventListener('storage', ({key, newValue}) => {
        if (key == ${JSON.stringify(localStorageKeyPrefix)} + ${JSON.stringify(name)} && newValue == 'ask') {
          window.localStorage.setItem(key, 'yes');
        }
      });
    </script>
  `)
  win.document.close();


  return win;
}

export function detectableWindowExists(name) {
  return new Promise(resolve => {
    function listener({key, newValue}) {
      if (key == localStorageKeyPrefix + name && newValue == 'yes') {
        resolve(true);
      }
    }
    window.addEventListener('storage', listener);
    localStorage.setItem(localStorageKeyPrefix + name, 'ask');
    setTimeout(() => {
      resolve(false);
      localStorage.setItem(localStorageKeyPrefix + name, 'no');
      window.removeEventListener('storage', listener);
    }, 200);
  });
}

export function frame() {
  return new Promise(r => requestAnimationFrame(r));
}

export async function wait(ms) {
  await new Promise(r => setTimeout(r, ms));
  await frame();
}

export function getCompoundTransform(element) {
  const chain = [];

  while (element) {
    chain.push(element);
    element = element.parentElement;
  }

  return chain.reverse().reduce((matrix, el) => {
    return matrix.multiplySelf(
      new DOMMatrix(window.getComputedStyle(el).transform)
    );
  }, new DOMMatrix());
}

function rectToQuad(rect) {
  return DOMQuad.fromRect({
    x: ('x' in rect) ? rect.x : rect.left,
    y: ('y' in rect) ? rect.y : rect.top,
    width: rect.width,
    height: rect.height
  });
}

export function getRelativeBoundingClientRect(from, to) {
  // Deal with ranges
  let toEl = to.commonAncestorContainer || to;

  if (toEl.nodeType != 1) toEl = toEl.parentElement;

  const m = getCompoundTransform(toEl).invertSelf();
  const fromQuad = rectToQuad(from.getBoundingClientRect());
  const toQuad = rectToQuad(to.getBoundingClientRect());
  const fromTopLeft = fromQuad.p1.matrixTransform(m);
  const toTopLeft = toQuad.p1.matrixTransform(m);
  const toBottomRight = toQuad.p3.matrixTransform(m);

  return new DOMRectReadOnly(
    toTopLeft.x - fromTopLeft.x,
    toTopLeft.y - fromTopLeft.y,
    toBottomRight.x - toTopLeft.x,
    toBottomRight.y - toTopLeft.y
  );
}

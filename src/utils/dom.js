const svgNs = 'http://www.w3.org/2000/svg';
const svgTagNames = new Set();

/**
 * @returns HTMLElement
 */
export function h(tagName, attributes, ...children) {
  let el;

  if (svgTagNames.has(tagName)) {
    el = document.createElementNS(svgNs, tagName);
  }
  else {
    el = document.createElement(tagName);

    if (el.constructor == HTMLUnknownElement && !tagName.includes('-')) {
      // Try SVG instead? This is really hacky.
      // TODO: find a better way.
      const svgEl = document.createElementNS(svgNs, tagName);

      if (svgEl.constructor !== SVGElement) { // Appears to be for unknown elements
        el = svgEl;
        svgTagNames.add(tagName);
      }
    }
  }

  if (attributes) for (const [name, val] of Object.entries(attributes)) {
    if (val !== false) el.setAttribute(name, val);
  }

  el.append(...children);

  return el;
}

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

export function createEmptyWindow(name) {
  return window.open(null, name,
    'menubar=no,toolbar=no,location=no,status=no'
  );
}
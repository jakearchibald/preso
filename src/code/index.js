import html from 'hyperhtml/esm';
import { findText, getRelativeBoundingClientRect, frame, wait } from '../utils/dom.js';
import { easeOutQuad, easeOutQuint } from '../utils/css-ease.js';
import css from './style.scss';
import hljs from 'highlight.js';
import js from 'highlight.js/lib/languages/javascript.js';
import xml from 'highlight.js/lib/languages/xml.js';
import SlideItem from '../slide-item';

hljs.registerLanguage('javascript', js);
hljs.registerLanguage('xml', xml);

document.head.append(html`<style>${css}</style>`);

function normalizeIndent(str) {
  // trim empty lines from start & end
  str = str.replace(/^\s?\n|\n\s?$/g, '');

  const lines = str.split('\n');
  const indentLen = /^\s*/.exec(lines[0])[0].length;
  return lines.map(l => l.slice(indentLen)).join('\n');
}

export default class Code extends SlideItem {
  constructor() {
    super();
    this._content = Promise.resolve('');
    this._updateQueued = false;

    this._children = [
      this._highlights = html`<div class="preso-code__highlights"></div>`,
      html`<pre>${this._code = html`<code class="hljs"></code>`}</pre>`
    ];
  }
  async firstConnected() {
    if (this.textContent.trim()) {
      // Runs the setter specified below
      this.textContent = this.textContent;
      this.innerHTML = '';
    }
    this.append(...this._children);
    this._queueUpdate();
  }
  attributeChangedCallback(name, oldVal, newVal) {
    if (name == 'src') {
      this._content = fetch(newVal).then(r => r.text());
    }
    if (this._hasBeenConnected) this._queueUpdate();
  }
  _queueUpdate() {
    if (this._updateQueued) return;
    this._updateQueued = true;

    const slide = this.closest('preso-slide');

    slide.synchronize((async () => {
      // allow multiple attrs to be changed
      await frame();
      this._updateQueued = false;
      await this._update();
    })());
  }
  async _update() {
    // Figure out language
    let lang = 'plain';

    if (this.codeLang) {
      lang = this.codeLang;
    }
    else if (this.src) {
      const result = /\.([^.]+)$/.exec(this.src);
      if (result[1]) lang = result[1];
    }

    const lines = (await this._content).split('\n');
    const start = this.start || 1;
    const end = (this.end || lines.length);
    // Start begins at 1, so deduct 1
    const content = lines.slice(start - 1, end).join('\n');
    const startHeight = window.getComputedStyle(this).height;
    let endHeight;

    // Set code
    // Are we just hiding existing code?
    // TODO: this shouldn't happen if lang has changed
    if (this.textContent.startsWith(content)) {
      const oldContent = this._code.innerHTML;
      this._code.textContent = content;

      this.style.height = 'auto';
      endHeight = window.getComputedStyle(this).height;
      this._code.innerHTML = oldContent;
    }
    else {
      if (lang == 'plain') {
        this._code.textContent = content;
      }
      else {
        const { value } = hljs.highlight(lang, content);
        this._code.innerHTML = value;
      }

      this.style.height = 'auto';
      endHeight = window.getComputedStyle(this).height;
      this.style.height = startHeight;
    }

    // Transition
    const slide = this.closest('preso-slide');

    if (!slide.transition) {
      this.style.height = 'auto';
      return;
    }

    slide.synchronize().then(() => {
      this.style.height = endHeight;

      this.animate([
        {height: startHeight},
        {height: endHeight}
      ], {
        duration: 300,
        easing: easeOutQuad
      });
    });

  }
  show(start, end) {
    this.start = start;
    this.end = end;
  }
  async _animateChars(range) {
    const slide = this.closest('preso-slide');

    await slide.synchronize();

    // Convert string to range
    if (typeof range == 'string') {
      range = findText(range, { root: this._code });
    }

    const root = range.commonAncestorContainer;
    const ittr = document.createNodeIterator(root, NodeFilter.SHOW_TEXT);
    const textNodes = [];
    const toAnimate = [];

    // Gathering the nodes first to avoid weird bugs where
    // stuff's changing as edits are made.
    while (true) {
      const textNode = ittr.nextNode();
      if (!textNode) break;
      if (range.intersectsNode(textNode)) {
        textNodes.push(textNode);
      }
    }

    for (const textNode of textNodes) {
      const text = textNode.nodeValue;
      const replacement = document.createDocumentFragment();

      let i = 0;
      let end = text.length;

      if (range.startContainer == textNode) {
        replacement.append(text.slice(0, range.startOffset));
        i = range.startOffset;
      }

      if (range.endContainer == textNode) {
        end = range.endOffset;
      }

      for (; i < end; i++) {
        const span = html`<span class="preso-code__char">${text[i]}</span>`;
        toAnimate.push(span);
        replacement.append(span);
      }

      if (range.endContainer == textNode) {
        replacement.append(text.slice(range.endOffset));
      }

      textNode.replaceWith(replacement);
    }

    return toAnimate;
  }
  set textContent(val) {
    this._content = Promise.resolve(normalizeIndent(val));
    this._queueUpdate();
  }
  get textContent() {
    return super.textContent;
  }
  highlight(range) {
    const div = html`<div class="preso-code__highlight"></div>`;
    const slide = this.closest('preso-slide');

    this._highlights.append(div);

    slide.synchronize().then(() => {
      // Convert string to range
      if (typeof range == 'string') {
        range = findText(range, {root: this._code});
      }

      const rect = getRelativeBoundingClientRect(this, range);

      Object.assign(div.style, {
        width: rect.width + 'px',
        height: rect.height + 'px',
        top: rect.top + 'px',
        left: rect.left + 'px'
      });

      div.animate([
        { transform: 'scaleX(0)' },
        { transform: '' }
      ], {
        duration: 300 * slide.transition,
        easing: easeOutQuint
      })
    });

    return div;
  }
  async backspace(range) {
    const els = await this._animateChars(range);
    const slide = this.closest('preso-slide');
    if (!slide.transition) return;

    for (const [i, el] of els.reverse().entries()) {
      setTimeout(() => {
        el.style.display = 'none';
      }, 70 * i * slide.transition);
    }

    return wait(els.length * 70);
  }
  async type(range) {
    const els = await this._animateChars(range);
    const slide = this.closest('preso-slide');
    if (!slide.transition) return;

    let delay = 0;

    for (const el of els) {
      delay += Math.pow(Math.random(), 2) * 150 + 20;
      el.style.display = 'none';
      setTimeout(() => {
        el.style.display = '';
      }, delay);
    }

    return wait(delay);
  }
}

const numberAttrs = ['start', 'end'];
const reflectAttrs = ['src', 'code-lang'];

Code.observedAttributes = [...numberAttrs, ...reflectAttrs];

for (const attr of numberAttrs) {
  const prop = attr.replace(/-\w/g, match => match.slice(1).toUpperCase());

  Object.defineProperty(Code.prototype, prop, {
    get() {
      return Number(this.getAttribute(attr));
    },
    set(val) {
      this.setAttribute(attr, Number(val));
    }
  });
}

for (const attr of reflectAttrs) {
  const prop = attr.replace(/-\w/g, match => match.slice(1).toUpperCase());

  Object.defineProperty(Code.prototype, prop, {
    get() {
      return this.getAttribute(attr);
    },
    set(val) {
      this.setAttribute(attr, val);
    }
  });
}

customElements.define('preso-code', Code);

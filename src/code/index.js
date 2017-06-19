/** @jsx h */
import { h, findText, getRelativeBoundingClientRect } from '../utils/dom.js';
import { easeOutQuad, easeOutQuint } from '../utils/css-ease.js';
import css from './style.scss';
import hljs from 'highlight.js/lib/highlight.js';
import js from 'highlight.js/lib/languages/javascript.js';

hljs.registerLanguage('javascript', js);

document.head.append(<style>{css}</style>);

function normalizeIndent(str) {
  // trim empty lines from start & end
  str = str.replace(/^\s?\n|\n\s?$/g, '');

  const lines = str.split('\n');
  const indentLen = /^\s*/.exec(lines[0])[0].length;
  return lines.map(l => l.slice(indentLen)).join('\n');
}

export default class Code extends HTMLElement {
  constructor() {
    super();
    this._hasBeenConnected = false;
    this._content = Promise.resolve('');
    this._updateQueued = false;

    this._children = [
      this._highlights = <div class="preso-code__highlights" />,
      <pre>
        {this._code = <code class="hljs" />}
      </pre>
    ];
  }
  async connectedCallback() {
    if (!this.closest('preso-slide')) throw Error("preso-code must be within a preso-slide");

    if (this._hasBeenConnected) return;
    this._hasBeenConnected = true;
    this._synchronize();

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
      if (this._hasBeenConnected) this._synchronize();
    }
    if (this._hasBeenConnected) this._queueUpdate();
  }
  _synchronize() {
    const slide = this.closest('preso-slide');
    slide.synchronize(this._content);
  }
  _queueUpdate() {
    if (this._updateQueued) return;
    this._updateQueued = true;
    
    const slide = this.closest('preso-slide');
    slide.synchronize().then(() => {
      this._updateQueued = false;
      this._update();
    });
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

    // Set code
    // Are we just hiding existing code?
    // TODO: this shouldn't happen if lang has changed
    if (this.textContent.startsWith(content)) {
      const range = findText(content, {root: this});

      const { height } = getRelativeBoundingClientRect(document.documentElement, range);
      this.style.height = height + 'px';
    }
    else {
      const result = hljs.highlight(lang, content);
      this._code.innerHTML = result.value;
      this.style.height = '';
    }

    // Transition
    const slide = this.closest('preso-slide');
    
    if (!slide.transition) return;

    const endHeight = window.getComputedStyle(this).height;

    await this.animate([
      {height: startHeight},
      {height: endHeight}
    ], {
      duration: 300,
      easing: easeOutQuad
    }).finished;
  }
  show(start, end) {
    this.start = start;
    this.end = end;
  }
  set textContent(val) {
    this._content = Promise.resolve(normalizeIndent(val));
  }
  get textContent() {
    return super.textContent;
  }
  highlight(range) {
    const div = <div class="preso-code__highlight" />;
    const slide = this.closest('preso-slide');

    this._highlights.append(div);

    slide.synchronize().then(() => {
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
        duration: 300,
        easing: easeOutQuint
      })
    });
    
    return div;
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
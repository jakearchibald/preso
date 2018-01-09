import html from 'hyperhtml/esm';
import css from './style.scss';

document.head.append(html`<style>${css}</style>`);

export default class Img extends HTMLElement {
  constructor() {
    super();
    this._hasBeenConnected = false;
    this._img = html`<img class="preso-img__img">`;
  }
  async connectedCallback() {
    if (this._hasBeenConnected) return;
    this._hasBeenConnected = true;

    const slide = this.closest('preso-slide');

    if (!slide) throw Error("preso-img must be within a preso-slide");

    this.append(this._img);

    await slide.synchronize(this._img.decode());

    this.classList.add('preso-img--show');
  }
  attributeChangedCallback(name, oldVal, newVal) {
    this._img.setAttribute(name, newVal);
  }
}

Img.observedAttributes = [
  'width', 'height', 'src', 'crossorigin'
];

const propMap = new Map();
propMap.set('crossorigin', 'crossOrigin');

// Forwarded property accessors
for (const attr of Img.observedAttributes) {
  const prop = propMap.get(attr) || attr;

  Object.defineProperty(Img.prototype, prop, {
    get() {
      this._img[prop];
    },
    set(val) {
      this._img[prop] = val;
    }
  });
}

customElements.define('preso-img', Img);

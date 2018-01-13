import html from 'hyperhtml/esm';

export default class SlideItem extends HTMLElement {
  constructor() {
    super();
    this._hasBeenConnected = false;
  }
  connectedCallback() {
    const slide = this.closest('preso-slide');
    if (!slide) throw Error(`${this.tagName} must be within a preso-slide`);
    if (this._hasBeenConnected) return;
    this._hasBeenConnected = true;
    this.firstConnected(slide);
  }
  firstConnected(slide) {
    // This should be overwritten
  }
}

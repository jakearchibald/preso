import html from 'hyperhtml/esm';
import { frame } from '../../utils/dom.js';
import { animWatcher } from '../../utils/anims';
import css from './style.scss';

document.head.append(html`<style>${css}</style>`);

export default class Slide extends HTMLElement {
  constructor() {
    super();
    this._func = null;
    this._nextResolve = null;
    this._complete = false;
    this._synchronizePromise = Promise.resolve();
    this._currentStateNum = 0;
    this._autoAdvanceNum = 0;
    this.transition = true;

    // Enables auto-animating elements with particular attributes
    animWatcher(this);
  }

  async _run(func, {
    preventTransition = false,
    autoAdvanceNum = 0
  }={}) {
    this.transition = !preventTransition;
    this._autoAdvanceNum = autoAdvanceNum;

    const slideDone = func(this);

    await slideDone;
    this._complete = true;
  }

  _advance({
    preventTransition = false
  }={}) {
    this.transition = !preventTransition;
    if (this._nextResolve) this._nextResolve();
  }

  next() {
    if (this._nextResolve) throw Error('next() called before previous next had resolved – ensure you await slide.next()');

    return new Promise(resolve => {
      this._nextResolve = resolve;
      if (this._autoAdvanceNum) {
        this._autoAdvanceNum--;
        resolve();
      }
    }).then(() => {
      this._currentStateNum++;
      this._nextResolve = null;
    });
  }

  async synchronize(promise = undefined) {
    if (promise) {
      promise = promise.catch(() => {
        // Don't rethrow the error, just log
        console.error('synchronize promise rejected', err);
      });
      this._synchronizePromise = this._synchronizePromise.then(() => promise);
    }

    let currentPromise;
    do {
      currentPromise = this._synchronizePromise;
      await currentPromise;
    } while (currentPromise !== this._synchronizePromise);
  }

  currentSynchronized() {
    return this._synchronizePromise;
  }
}

customElements.define('preso-slide', Slide);

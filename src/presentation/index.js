import html from 'hyperhtml/esm';

import './notes/index.js';
import {createDetectableWindow, detectableWindowExists} from '../utils/dom.js';
import Slide from './slide/index.js';
import {fade, fadeBlank} from './transitions/index.js';
import css from './style.scss';
import { swap } from './transitions';

export default class Presentation extends HTMLElement {
  constructor() {
    super();

    this.defaultTransition = fade();

    this._hasBeenConnected = false;
    this._currentSlideNum = -1;
    this._currentSlide = null;
    this._slideFuncs = [];
    this._transitionFuncs = [];
    // Appended in connectedCallback
    this._stage = html`<div class="preso__stage"></div>`;
    this.notes = html`<preso-notes></preso-notes>`;
    this._notesWindow = null;

    // Add shadow dom
    let resizeObserver;

    this.attachShadow({mode: 'closed'}).append(
      this._shadowStyle = html`<style>${css}</style>`,
      html`<div class="preso__layout">
        ${this._stageCell = html`<div class="preso__cell"></div>`}
        ${this._notesCell = html`<div class="preso__cell"></div>`}
        ${resizeObserver = html`<iframe class="preso__resize-observer"></iframe>`}
      </div>`,
      html`<slot></slot>`
    );

    // Watch for element size changes
    resizeObserver.addEventListener('load', () => {
      resizeObserver.contentWindow.addEventListener('resize', () => this._handleResize());
    });
    resizeObserver.src = '';

    // Add key listeners
    this.addEventListener('keydown', event => {
      switch (event.key) {
        case ' ':
          event.preventDefault();
          this.next();
          break;
        case 'ArrowRight':
          event.preventDefault();
          this.next({preventTransition: true});
          break;
        case 'ArrowLeft':
          event.preventDefault();
          this.previous({preventTransition: true});
          break;
        case 'f':
          event.preventDefault();
          this._fullscreen();
      }
    });

    // Other listeners
    this.notes.addEventListener('popoutclick', () => this._popoutNotes());
    this.notes.addEventListener('slideswitch', event => this._onSlideSwitchClicked(event));
  }

  async connectedCallback() {
    if (!this._hasBeenConnected) {
      this.style.opacity = 0;
      this._hasBeenConnected = true;
      this.append(this._stage, this.notes);
      this.tabIndex = 0;

      this._stage.style.width = `${this.width}px`;
      this._stage.style.height = `${this.height}px`;
      this.notes.style.width = `${this.notesWidth}px`;
      this.notes.style.height = `${this.notesHeight}px`;

      if (await detectableWindowExists('notes')) {
        this._popoutNotes();
      }
      this.style.opacity = 1;
    }

    this._handleResize();
  }

  attributeChangedCallback(name, oldVal, newVal) {
    switch(name) {
      case 'width':
        this._stage.style.width = `${this.width}px`;
        this._handleResize();
        break;
      case 'height':
        this._stage.style.height = `${this.height}px`;
        this._handleResize();
        break;
      case 'notes-width':
        this.notes.style.width = `${this.notesWidth}px`;
        this._handleResize();
        break;
      case 'notes-height':
        this.notes.style.height = `${this.notesHeight}px`;
        this._handleResize();
        break;
      case 'no-notes':
        if (newVal !== null) {
          this._notesCell.remove();
        }
        break;
    }
  }

  _onSlideSwitchClicked(event) {
    this.goTo(event.detail.slideIndex, { transition: fadeBlank() });
  }

  _popoutNotes() {
    const win = createDetectableWindow('notes');
    this._notesWindow = win;
    win.document.documentElement.classList.add('notes-popup');
    win.document.body.append(this.notes);
    this._notesCell.remove();
    this._notesCell = win.document.documentElement;
    win.addEventListener('resize', () => this._handleResize());
    this._handleResize();
  }

  _fullscreen() {
    this.webkitRequestFullscreen();
    this.style.cursor = 'none';

    // Fullscreen notes too
    if (this._notesWindow) {
      this._notesWindow.document.body.webkitRequestFullscreen();
    }
  }

  _handleResize() {
    const stageRect = this._stageCell.getBoundingClientRect();
    const notesRect = this._notesCell.getBoundingClientRect();

    // Resize stage
    const stageScale = Math.min(
      stageRect.width / this.width,
      stageRect.height / this.height
    );

    const stageLeft = (stageRect.width - (this.width * stageScale)) / 2 + stageRect.left;
    const stageTop = (stageRect.height - (this.height * stageScale)) / 2 + stageRect.top;

    this._stage.style.transform = `translate(${stageLeft}px, ${stageTop}px) scale(${stageScale})`;

    // Resize notes
    const notesScale = Math.min(
      notesRect.width / this.notesWidth,
      notesRect.height / this.notesHeight
    );

    const notesLeft = (notesRect.width - (this.notesWidth * notesScale)) / 2 + notesRect.left;
    const notesTop = (notesRect.height - (this.notesHeight * notesScale)) / 2 + notesRect.top;

    this.notes.style.transform = `translate(${notesLeft}px, ${notesTop}px) scale(${notesScale})`;
  }

  slide(slideName, asyncFunc) {
    // Make slideName optional:
    if (!asyncFunc) {
      asyncFunc = slideName;
      slideName = 'Unknown slide';
    }

    this._slideFuncs.push(asyncFunc);
    this._transitionFuncs.push(this.defaultTransition);
    this.notes._addSlideReference(slideName);

    if (this._slideFuncs.length == 1) {
      this.goTo(0);
    }
  }

  transition(transitionFunc) {
    this._transitionFuncs[this._transitionFuncs.length - 1] = transitionFunc;
  }

  async startHere() {
    const num = this._slideFuncs.length;
    await null; // microtask
    this.goTo(num, { transition: swap() });
  }

  async goTo(num, {
    state = 0,
    preventTransition = false,
    transition
  }={}) {
    const slide = new Slide();
    const exitingSlide = this._currentSlide;
    const func = this._slideFuncs[num];

    this._currentSlide = slide;
    this._currentSlideNum = Number(num);

    slide.style.opacity = 0;
    this._stage.append(slide);

    slide._run(func, {
      autoAdvanceNum: state,
      preventTransition
    });

    // Use the provided transition, avoid transitioning, or use the slide's transition
    transition = transition || (preventTransition ? false : this._transitionFuncs[num - 1]);

    if (transition) {
      await transition(slide, exitingSlide, this._stage);
    }
    else {
      await slide.synchronize();
      slide.style.opacity = 1;
    }

    if (exitingSlide) exitingSlide.remove();
  }

  next({
    preventTransition = false
  }={}) {
    if (this._currentSlide._complete) {
      // As long as it isn't the last slide
      if (this._currentSlideNum + 1 != this._slideFuncs.length) {
        this.goTo(this._currentSlideNum + 1, {preventTransition});
      }
      return;
    }
    this._currentSlide._advance({preventTransition});
  }

  previous() {
    if (this._currentSlide._currentStateNum == 0) {
      // As long as we aren't already on the first slide
      if (this._currentSlideNum != 0) {
        this.goTo(this._currentSlideNum - 1, {
          preventTransition: true,
          state: -1
        });
      }
      return;
    }

    this.goTo(this._currentSlideNum, {
      preventTransition: true,
      state: this._currentSlide._currentStateNum - 1
    });
  }
}

const numberAttrs = ['width', 'height', 'notes-width', 'notes-height'];
const boolAttrs = ['no-notes'];

Presentation.observedAttributes = [
  ...numberAttrs, ...boolAttrs
];

// Property accessors for attributes
for (const attr of numberAttrs) {
  const prop = attr.replace(/-\w/g, match => match.slice(1).toUpperCase());

  Object.defineProperty(Presentation.prototype, prop, {
    get() {
      const num = Number(this.getAttribute(attr));
      if (num) return num;

      // defaults:
      if (attr.endsWith('width')) return 1920;
      if (attr.endsWith('height')) return 1080;
    },
    set(val) {
      this.setAttribute(attr, Number(val));
    }
  });
}

for (const attr of boolAttrs) {
  const prop = attr.replace(/-\w/g, match => match.slice(1).toUpperCase());

  Object.defineProperty(Presentation.prototype, prop, {
    get() {
      return this.hasAttribute('no-notes');
    },
    set(val) {
      if (val) {
        this.setAttribute('no-notes', '');
      }
      else {
        this.removeAttribute('no-notes');
      }
    }
  });
}

customElements.define('preso-presentation', Presentation);

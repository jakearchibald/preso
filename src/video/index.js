import html from 'hyperhtml'
import SlideItem from '../slide-item';
import css from './style.scss';

document.head.append(html`<style>${css}</style>`);

export default class Video extends SlideItem {
  constructor() {
    super();
    this._video = html`<video class="preso-video__video"></video>`;
    this._video.preload = 'auto';
    this._playingListener = null;

    this._videoReady = new Promise((resolve, reject) => {
      this._video.addEventListener('canplaythrough', () => resolve());
      this._video.addEventListener('error', () => reject(Error('Video load failed')));
    });

    this._metaReady = new Promise(resolve => {
      this._video.addEventListener('loadedmetadata', () => resolve());
    });
  }
  async firstConnected(slide) {
    this.append(this._video);
    await slide.synchronize(this._videoReady);
    this.classList.add('preso-video--show');
  }
  async seekTo(time) {
    await this._metaReady;
    this._video.currentTime = time;
  }
  async play(timeUntil) {
    const slide = this.closest('preso-slide');

    await this._videoReady;

    if (!slide.transition) {
      this.seekTo(timeUntil || this._video.duration);
      return;
    }

    if (this._playingListener) {
      this._video.removeEventListener('timeupdate', this._playingListener);
    }

    if (timeUntil) {
      this._playingListener = () => {
        if (this._video.currentTime >= timeUntil) {
          this._video.pause();
        }
      };

      this._video.addEventListener('timeupdate', this._playingListener);
    }

    this._video.play();
  }
  loop() {
    this._video.loop = true;
    this.play();
  }
  attributeChangedCallback(name, oldVal, newVal) {
    this._video.setAttribute(name, newVal);
  }
}

Video.observedAttributes = [
  'width', 'height', 'src', 'crossorigin'
];

const propMap = new Map();
propMap.set('crossorigin', 'crossOrigin');

// Forwarded property accessors
for (const attr of Video.observedAttributes) {
  const prop = propMap.get(attr) || attr;

  Object.defineProperty(Video.prototype, prop, {
    get() {
      this._video[prop];
    },
    set(val) {
      this._video[prop] = val;
    }
  });
}

customElements.define('preso-video', Video);

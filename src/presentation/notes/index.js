/** @jsx h */
import { h } from '../../utils/dom.js';
import css from './style.scss';

export default class Notes extends HTMLElement {
  constructor() {
    super();
    this._hasBeenConnected = false;
    this._notesList = <ol class="preso-notes-list"/>;
    this._controls = (
      <div class="preso-notes__controls">
        {this._time = <div class="preso-notes-time"/>}
        {this._popOutBtn = <button class="preso-notes__pop-out"><span>Pop-out</span><svg viewBox="0 0 16 20"><path d="M9 0v2h3L7 7l2 2 5-5v3h2V0H9zm5 14H2V2h4V0H0v16h16v-6h-2v4z"/></svg></button>}
      </div>
    );
    this._timeFormat = new Intl.DateTimeFormat('lookup', {
      timeZone: 'UTC',
      hour: 'numeric', minute: 'numeric', second: 'numeric'
    });
    this._timerStart = 0;

    // Listeners
    this._popOutBtn.addEventListener('click', () => this._onPopOutClick());
  }
  connectedCallback() {
    if (this._hasBeenConnected) return;
    this._hasBeenConnected = true;

    this.append(
      // Adding the CSS to the element so it works when moved into its own iframe
      <style>{css}</style>,
      <div class="preso-notes-view">
        {this._notesList}
        {this._controls}
      </div>
    );
  }
  _onPopOutClick() {
    this.dispatchEvent(new CustomEvent('popoutclick'));
  }
  set(notes) {
    if (!Array.isArray(notes)) {
      notes = notes.trim().split('\n');
    }
    this._notesList.innerHTML = '';
    this._notesList.append(...notes.map(s => <li class="preso-notes-list__item">{s}</li>));
  }
  _updateTimer() {
    this._time.textContent = this._timeFormat.format(Date.now() - this._timerStart);
  }
  startTimer() {
    if (this._timerStart == 0) {
      setInterval(() => this._updateTimer(), 1000);
    }
    this._timerStart = Date.now();
    this._updateTimer();
  }
}

customElements.define('preso-notes', Notes);
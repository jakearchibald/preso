import html from 'hyperhtml/esm';
import css from './style.scss';

export default class Notes extends HTMLElement {
  constructor() {
    super();
    this._hasBeenConnected = false;
    this._notesList = html`<ol class="preso-notes-list"></ol>`;
    this._slideList = html`<ol class="preso-slide-list"></ol>`;
    this._controls = html`
      <div class="preso-notes__controls">
        ${this._time = html`<div class="preso-notes-time"></div>`}
        <div class="preso-notes__buttons">
          ${this._slidesListBtn = html`<button class="preso-notes__button"><span>Toggle slide list</span><svg viewBox="0 0 24 24"><path d="M3 13h2v-2H3v2zm0 4h2v-2H3v2zm0-8h2V7H3v2zm4 4h14v-2H7v2zm0 4h14v-2H7v2zM7 7v2h14V7H7z" /></svg></button>`}
          ${this._popOutBtn = html`<button class="preso-notes__button preso-notes__popout-button"><span>Pop-out</span><svg viewBox="0 0 24 24"><path d="M19 19H5V5h7V3H5C4 3 3 4 3 5v14c0 1 1 2 2 2h14c1 0 2-1 2-2v-7h-2v7zM14 3v2h3.6l-9.8 9.8 1.4 1.4L19 6.4V10h2V3h-7z" /></svg></button>`}
        </div>
      </div>
    `;
    this._timeFormat = new Intl.DateTimeFormat('en-gb', {
      timeZone: 'UTC',
      hour: 'numeric', minute: 'numeric', second: 'numeric',
      hour12: false
    });
    this._timerStart = 0;
    this._showingListView = false;
    this._slideList.style.display = 'none';

    // Listeners
    this._popOutBtn.addEventListener('click', () => this._onPopOutClick());
    this._slideList.addEventListener('click', event => {
      const btn = event.target.closest('button');
      if (btn) this._onSlideListClick(btn);
    });
    this._slidesListBtn.addEventListener('click', () => this._toggleListView());
  }
  connectedCallback() {
    if (this._hasBeenConnected) return;
    this._hasBeenConnected = true;
    // Adding the CSS to the element so it works when moved into its own iframe
    this.append(...html`
      <style>${css}</style>
      <div class="preso-notes-view">
        ${this._slideList}
        ${this._notesList}
        ${this._controls}
      </div>
    `.childNodes);
  }
  _onPopOutClick() {
    this.dispatchEvent(new CustomEvent('popoutclick'));
  }
  _onSlideListClick(btn) {
    this.dispatchEvent(new CustomEvent('slideswitch', {
      detail: {slideIndex: Number(btn.dataset.slideIndex)}
    }));
  }
  _toggleListView() {
    this._showingListView = !this._showingListView;
    this._slideList.style.display = this._showingListView ? '' : 'none';
    this._notesList.style.display = !this._showingListView ? '' : 'none';
  }
  set(notes) {
    if (!Array.isArray(notes)) {
      notes = notes.trim().split('\n');
    }
    this._notesList.innerHTML = '';
    this._notesList.append(...notes.map(s => html`<li class="preso-notes-list__item">${s}</li>`));
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
  _addSlideReference(name) {
    const slideIndex = this._slideList.children.length;
    this._slideList.append(html`
      <li class="preso-slide-list__item">
        <button
          data-slide-index=${slideIndex}
          class="preso-slide-list__button"
          hidden="${name === "Unknown slide"}"
        >${name}</button>
      </li>
    `);
  }
}

customElements.define('preso-notes', Notes);

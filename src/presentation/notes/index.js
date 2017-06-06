/** @jsx h */
import { h } from '../../utils/dom.js';
import css from './style.scss';


export default class Notes extends HTMLElement {
  constructor() {
    super();
    this._hasBeenConnected = false;
    this._notesList = <ol class="preso-notes-list"/>;
  }
  connectedCallback() {
    if (this._hasBeenConnected) return;
    this._hasBeenConnected = true;

    // Adding the CSS to the element so it works when moved into its own iframe
    this.append(<style>{css}</style>, this._notesList);
  }
  set(notes) {
    if (!Array.isArray(notes)) {
      notes = notes.trim().split('\n');
    }
    this._notesList.innerHTML = '';
    this._notesList.append(...notes.map(s => <li class="preso-notes-list__item">{s}</li>));
  }
}

customElements.define('preso-notes', Notes);
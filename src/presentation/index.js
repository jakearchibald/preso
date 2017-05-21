/** @jsx h */
import {h} from '../utils/dom.js';

const element = (
  <hello-world foo="bar">
    Hello <span>world</span>
    <ok-stuff enabled/>
  </hello-world>
);

console.log(element);
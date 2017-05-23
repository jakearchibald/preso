/**
 * @returns HTMLElement
 */
export function h(tagName, attributes, ...children) {
  const el = document.createElement(tagName);

  if (attributes) for (const [name, val] of Object.entries(attributes)) {
    if (val !== false) el.setAttribute(name, val);
  }

  el.append(...children);

  return el;
}
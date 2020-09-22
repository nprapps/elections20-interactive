var registry = Symbol("event registry");

export default class EventTarget {
  constructor() {
    this[registry] = {};
  }

  addEventListener(type, listener) {
    if (!this[registry][type]) {
      this[registry][type] = [];
    }
    this[registry][type].push(listener);
  }

  removeEventListener(type, listener) {
    if (!this[registry][type]) return;
    this[registry][type] = this[registry][type].filter(f => f != listener);
  }

  dispatchEvent(type, event) {
    // console.log(this.constructor.name, type, event);
    var queue = this[registry][type];
    if (!queue) return;
    queue.forEach(f => f(event));
  }
}
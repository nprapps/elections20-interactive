// class for centrally monitoring URLs
import EventTarget from "./eventTarget.js";

export class Gopher extends EventTarget {
  constructor(interval = 10) {
    super();
    this.interval = interval;
    this.urls = new Map();
    this.timeout = null;
    this.watchCount = 0;

    //bind timer callbacks
    this.tick = this.tick.bind(this);
  }

  addURL(url) {
    var entry = {
      url,
      etag: null,
      modified: null,
      callbacks: [],
      last: null
    };
    this.urls.set(url, entry);
    return entry;
  }

  async sync(entry) {
    var headers = {};
    if (entry.etag) headers["If-None-Match"] = entry.etag;
    if (entry.modified) headers["If-Modified-Since"] = entry.modified;
    try {
      var response = await fetch(entry.url, { headers });
      if (response.status == 304) return;
      entry.etag = response.headers.get("etag") || entry.etag;
      entry.modified = response.headers.get("last-modified") || entry.modified;
      var json = await response.json();
      entry.last = json;
    } catch (e) {
      // log failures, but tolerate them
      console.error(`Fetch failed for ${entry.url}`)
      return;
    }
    this.dispatchEvent("change", entry.url);
    entry.callbacks.forEach((c) => c(json));
    return json;
  }

  watch(url, callback) {
    var normalized = new URL(url, window.location.href).toString();
    var entry = this.urls.get(normalized) || this.addURL(normalized);
    entry.callbacks.push(callback);
    this.watchCount++;
    this.sync(entry);
    if (!this.timeout) {
      this.schedule();
    }
    // return cached state immediately
    if (entry.last) {
      callback(entry.last);
    }
  }

  unwatch(url, callback) {
    var normalized = new URL(url, window.location.href).toString();
    var entry = this.urls.get(normalized);
    if (!entry) return console.warn(`No gopher entry found for ${url}`);
    entry.callbacks = entry.callbacks.filter((c) => c != callback);
    this.watchCount--;
    if (this.watchCount <= 0) {
      this.watchCount = 0;
      if (this.timeout) {
        clearTimeout(this.timeout);
        this.timeout = null;
      }
    }
  }

  schedule() {
    var delay = this.interval * 1000;
    this.scheduled = Date.now() + delay;
    if (this.timeout) clearTimeout(this.timeout);
    this.timeout = setTimeout(this.tick, delay);
    this.dispatchEvent("schedule", this.interval);
  }

  async tick() {
    this.dispatchEvent("sync-start");
    var urls = [...this.urls.values()];
    var requests = urls.map(entry => {
      if (!entry.callbacks.length) return Promise.resolve();
      return this.sync(entry);
    });
    await Promise.all(requests);
    this.dispatchEvent("sync-end");
    this.schedule();
  }
}

var gopher = new Gopher();

export default gopher;

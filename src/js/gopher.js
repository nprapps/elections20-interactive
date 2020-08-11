// class for centrally monitoring URLs

export class Gopher {
  constructor(interval = 10) {
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
      callbacks: [],
      last: null
    };
    this.urls.set(url, entry);
    return entry;
  }

  async sync(entry) {
    var response = await fetch(entry.url, {
      headers: {
        "If-None-Match": entry.etag
      }
    });
    if (response.status == 304) return;
    entry.etag = response.headers.get("etag");
    var json = await response.json();
    entry.last = json;
    entry.callbacks.forEach((c) => c(json));
    return json;
  }

  watch(url, callback) {
    var entry = this.urls.get(url) || this.addURL(url);
    entry.callbacks.push(callback);
    this.watchCount++;
    this.sync(entry);
    if (!this.timeout) {
      this.timeout = setTimeout(this.tick, this.interval * 1000);
    }
    // return cached state immediately
    if (entry.last) {
      callback(entry.last);
    }
  }

  unwatch(url, callback) {
    var entry = this.urls.get(url);
    if (!entry) throw `No gopher entry found for ${url}`;
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

  tick() {
    for (var entry of this.urls.values()) {
      if (!entry.callbacks.length) continue;
      this.sync(entry);
    }
    setTimeout(this.tick, this.interval * 1000);
  }
}

var gopher = new Gopher();

export default gopher;

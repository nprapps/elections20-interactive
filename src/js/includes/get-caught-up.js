// Polyfills that aren't covered by `babel-preset-env`

// import { h, createProjector } from 'maquette';
import { h, Component } from 'preact';
import { buildDataURL, getHighestPymEmbed } from './helpers.js';

var lastRequestTime;
var initialized = false;
var useDebug = false;
var isValidMarkup;

export class GetCaughtUp extends Component {
  constructor() {
    super();

    this.state = {};
  }

  // Lifecycle: Called whenever our component is created
  async componentDidMount() {
    var result = await fetch('./assets/data/get-caught-up.json')

    var data = result.ok ? await result.json() : console.warn(Error(result.statusText));
    this.setState(data);
  }

  // Lifecycle: Called just before our component will be destroyed
  componentWillUnmount() {
  // stop when not renderable
  }

  render() {
    if (!this.state.content) {
      return <div class="get-caught-up-wrapper"> "Loading..." </div>;
    } else if (false) {
      return <div></div>;
    }

    // setTimeout(window.pymChild.sendHeight, 0);
    var bullets = Object.keys(this.state.content)
            .filter(k => k.match(/^bullet/))
            .sort()
            .map(k => this.state.content[k]);

    var intros = Object.keys(this.state.content)
          .filter(k => k.match(/^intro/))
          .sort()
          .map(k => this.state.content[k]);

    return <div>
            <h2> Latest Election Headlines</h2>
            {intros.map(s => <p dangerouslySetInnerHTML={{__html: s}}></p>)}
            <ul>
              {bullets.map(s => <li dangerouslySetInnerHTML={{__html: s}}></li>)}
            </ul>
          </div>
    
  }
}

export function renderGetCaughtUp () {
  const wrapper = document.querySelector('.get-caught-up-wrapper');
  projector.replace(wrapper, renderMaquette);

  // Have to delay so that `window.pymChild` is instantiated
  setTimeout(
    () => {
      if (!initialized) {
        initialized = true;

        // Allow loading of the debug `get-caught-up` file instead
        // const highestPymChildParentUrl = window.pymChild && getHighestPymEmbed(window).parentUrl;
        // const urlToCheck = highestPymChildParentUrl || document.URL;
        // useDebug = URL(urlToCheck, true).query['gcu-debug'] === '1';
        dataURL = buildDataURL('get-caught-up.json');
        getData();

        // This `setInterval` will persist across re-renderings
        setInterval(getData, 5000);
      }
    }, 0
  );
}

var getData = async function () {
  var res = await window.fetch(dataURL, { headers: { 'If-Modified-Since': lastRequestTime } })

  var json;
  if (res.ok) {
    json = await res.json();
  } else {
    throw console.warn(Error(res.statusText));
  }
  
  lastRequestTime = new Date().toUTCString();
  if (json) {
    data = json.content;
    isValidMarkup = json.meta.is_valid_markup;
    projector.scheduleRender();
  }
};

function renderMaquette () {
  const INTRO_KEY_PREFIX = 'intro_';
  const BULLET_KEY_PREFIX = 'bullet_';

  if (!data) {
    return h('div.get-caught-up-wrapper', 'Loading...');
  } else {
    setTimeout(window.pymChild.sendHeight, 0);

    if (!isValidMarkup && !useDebug) {
      return h('div', []);
    } else if (!isValidMarkup && useDebug) {
      return h('div.get-caught-up-wrapper', [
        // Can't use 'Latest Election Headlines [DEBUG]',
        // since that won't fit the single-line space
        h('h2', 'Election Headlines [DEBUG]'),
        h('p', data)
      ]);
    } else {
      return h('div.get-caught-up-wrapper', [
        h('h2', useDebug ? 'Election Headlines [DEBUG]' : 'Latest Election Headlines'),

        // Render intro paragraphs
        ...Object.keys(data)
          .filter(k => k.startsWith(INTRO_KEY_PREFIX))
          .filter(k => data[k] !== '')
          .sort((a, b) => a > b ? 1 : -1)
          .map(k => h('p', { key: k, innerHTML: data[k] })),

        // Render bullet points
        h(
          'ul',
          Object.keys(data)
            .filter(k => k.startsWith(BULLET_KEY_PREFIX))
            .filter(k => data[k] !== '')
            .sort((a, b) => a > b ? 1 : -1)
            .map(k => h('li', { key: k, innerHTML: data[k] }))
        )
      ]);
    }
  }
}

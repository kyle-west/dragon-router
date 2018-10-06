/*******************************************************************************
* @class stores the state of the route and used to track page state
*******************************************************************************/
class Context {
  constructor (url = "", routerId) {
    this.url = url;
    let fullPath;
    if (url.includes('://')) {
      let [proto, rest] = url.split("://");
      this.protocol = proto;
      fullPath = rest.substr(rest.indexOf('/'))
    } else {
      fullPath = url;
    }
    let [path, search] = fullPath.split('?');
    this.path = path || '';
    this.routerId = routerId;
    this.collectSearchParams(search);
  }
  
  collectSearchParams (search) {
    this.search = search || '';
    if (!search) return;
    let params = {};
    search.split('&').forEach(pair => {
      if (pair.includes("=")) {
        let [key, value] = pair.split('=');
        params[key] = value;
      }
    })
    this.search.params = params; 
  }
}

/*******************************************************************************
* @class Tokenizes a path to help with better matching and grepping strings
*******************************************************************************/
class TokenizedPath {
  constructor (path) {
    this.path = path;

    this.sections = (path[0] === '/') ? path.slice(1).split('/') : path.split('/');
    this.tokens = this.sections.map(part => {
      if (TokenizedPath.MATCHING_PARAM.test(part)) {
        let [name, regex] = part.slice(1).split('(')
        regex = new RegExp('^('+regex+'$');
        return {name, regex};
      } else if (TokenizedPath.SIMPLE_PARAM.test(part)) {
        let name = part.slice(1)
        let regex = /.+/;
        return {name, regex};
      } else {
        return {regex: new RegExp('^'+part+'$')};
      }
    })
  }
  
  matches (str) {
    // allow for paths that have a trailing '/'
    let path = str;
    if (str[str.length-1] === '/') {
      path = str.substring(0, str.length-1);
    }

    // require all literal paths to include '/' at the front
    let parts = path.slice(1).split('/');

    if (parts.length !== this.sections.length) return false;

    let params = {};
    for (let i = 0; i < parts.length; i++) {
      let token = this.tokens[i];
      let part = parts[i];
      if (token.regex.test(part)) {
        if (token.name) {
          params[token.name] = part;
        }
      } else {
        return false;
      }
    }
    return params;
  }

  static get SIMPLE_PARAM () {
    return /^:\w+$/;
  }

  static get MATCHING_PARAM () {
    return /^:\w+\(.*\)$/;
  }
}


/*******************************************************************************
* @class fires a set of middleware callbacks when a Context matches its route
*******************************************************************************/
class RouteHandler {
  constructor (path, actions) {
    this.path = path;
    this.tokenizedPath = new TokenizedPath(path);
    this.actions = actions;
  }

  matches (context) {
    let matches = this.tokenizedPath.matches(context.path);
    if (matches !== false) {
      context.params = matches;
      this.fireActions(context);
      return true;
    } else {
      return false;
    }
  }

  fireActions (context) {
    let idx = 0;
    let next = () => {
      let fn = this.actions[idx++];
      fn && fn(context, next);
    }
    next();
  }
}

/*******************************************************************************
* @exports ClientRouter
* @class manages the client routing on the window
* 
* @todo Add manual navigators;
*          - `ClientRouter.navigate()`
*          - `ClientRouter.back()`
*          - `ClientRouter.forward()`
*          - `ClientRouter.redirect()`
*******************************************************************************/
export class ClientRouter {
  constructor (options) {
    options = options || {};
    this.routerId = options.routerId || Math.random();
    this.debug = !!(options.debug);
    this.registrar = [];
  }

  use (path, ...actions) {
    this.registrar.push(new RouteHandler(path, actions));
  }

  registerOn(window) {
    let onclick = window.document.ontouchstart ? 'touchstart' : 'click';
    window.addEventListener(onclick, this._onClick.bind(this));
    window.addEventListener('pushstate', this._onPushState.bind(this));
    window.addEventListener('popstate', this._onPopState.bind(this));
    this.debug && console.log(`Router {${this.routerId}} registered to`, window, this);
  }

  _onClick (e) {
    if (e.metaKey || e.ctrlKey || e.shiftKey) return;
    if (e.defaultPrevented) return;
    
    
    // Get the href of the <a> tag
    let target = e.target;
    let domPath = e.path || e.composedPath(); // FF needs composedPath()
    
    if (domPath) {
      for (let i = 0; i < domPath.length; i++) {
        if (domPath[i].href && domPath[i].nodeName === 'A') {
          target = domPath[i];
          break;
        }
      }
    }
    
    let path = target.href;
    if (!path) return;
    
    e.preventDefault();
    this.evalute(new Context(path, this.routerId));
  }

  _onPushState (e) {
    console.warn('ClientRouter::onPushState NOT IMPLEMENTED');
    debugger;
  }

  _onPopState (e) {
    console.warn('ClientRouter::onPopState NOT IMPLEMENTED');
    debugger;
  }
  
  evalute (context) {
    for (let i = 0; i < this.registrar.length; i++) {
      if (this.registrar[i].matches(context)) {
        this.pushState(context);
        return;
      }
    }
    window.location = context.url;
  }
  
  pushState (context) {
    window.history.pushState(context, null, context.path)
  }
}
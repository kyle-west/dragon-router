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
      this.domain = rest.substring(0, rest.indexOf('/'));
    } else {
      fullPath = url;
    }
    let [path, search] = fullPath.split('?');
    this.path = path || '';
    this.routerId = routerId;
    this.collectSearchParams(search);
    this.isRecordedHistory = false;
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
    this.regExPath = (path[path.length -1] === '*') 
                   ? new RegExp('^'+path.substr(0,path.length-1).replace(/\:[^\/]*/, '.*')+'.*$')
                   : new RegExp('^'+path+'$');
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
    let matchesFullPathRegex = (this.regExPath.test(str)); 

    // allow for paths that have a trailing '/'
    let path = str;
    if (str[str.length-1] === '/') {
      path = str.substring(0, str.length-1);
    }

    // require all literal paths to include '/' at the front
    let parts = path.slice(1).split('/');

    if (!matchesFullPathRegex && (parts.length !== this.sections.length)) return false;

    let params = {};
    for (let i = 0; i < parts.length; i++) {
      let token = this.tokens[i];
      let part = parts[i];
      if (token && token.regex.test(part)) {
        if (token.name) {
          params[token.name] = part;
        }
      } else if (!matchesFullPathRegex){
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
* @class 
*******************************************************************************/
class DerivedSubpath {
  constructor (name, callback) {
    this.name = name;
    this.callback = callback;
  }
}


/*******************************************************************************
* @class fires a set of middleware callbacks when a Context matches its route
*******************************************************************************/
class RouteHandler {
  constructor (path, actions) {
    this.path = path;
    this.tokenizedPath = new TokenizedPath(path.replace(/\$:/g, ':'));
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
*******************************************************************************/
class ClientRouter {
  constructor (options) {
    options = options || {};
    this.routerId = options.routerId || Math.random();
    this.debug = !!(options.debug);
    this.registrar = [];
    this.subpaths = {};
    if (options.registerOn) {
      this.registerOn(options.registerOn)
    }
  }

  use (firstArg, ...actions) {
    if (firstArg instanceof DerivedSubpath) {
      this.subpaths[firstArg.name] = firstArg.callback;
    } else if (firstArg instanceof RouteHandler) {
      this.registerHandlers(firstArg);
    } else if (firstArg instanceof Array) {
      firstArg.forEach(item => {
        this.use(item, ...actions);
      });
    } else if (typeof firstArg === 'string') {
      this.registerHandlers(new RouteHandler(firstArg, actions));
    }
  }
  
  registerHandlers (routeHandle, isRecursive = false) {
    let route = routeHandle.path;

    if (route.includes("?")) {
      let full = [];
      let part = [];
      route.split('/').forEach(path => {
        if (path[path.length -1] === "?") {
          full.push(path.substring(0, path.length - 1))
        } else {
          full.push(path);
          part.push(path);
        }
      });

      this.registerHandlers(new RouteHandler(part.join('/'), routeHandle.actions))
      this.registerHandlers(new RouteHandler(full.join('/'), routeHandle.actions))
      return;
    }

    if (route.includes("$:")) {
      let idx = route.indexOf("$:");
      let before = route.substring(0, idx-1);
      let rest = route.substr(idx+2);
      let dPath = rest.split('/')[0].split('(')[0];

      this.registrar.push(new RouteHandler(before, [async (context) => {
        try {
          let lastChar = context.path.length-1;
          let query = (context.search) ? ('?' + context.search) : '';
          let base = (context.path[lastChar] === '/') ? context.path.substring(0, lastChar) : context.path; 
          let forwardPath = `${base}/${await this.subpaths[dPath](context)}${query}`;
          this.redirect(forwardPath);
        } catch (err) { throw err; }
      }]));

      let remainingRoute = route.replace('$:', ':');
      if (remainingRoute.includes('$:')) {
        this.registerHandlers(new RouteHandler(remainingRoute), true)
      } 
      let afterSections = rest.split('/').slice(1)
      let routeWithRemovedSection = [before, ...afterSections].join('/');
      this.registrar.push(new RouteHandler(routeWithRemovedSection, [async (context) => {
        try {
          let query = (context.search) ? ('?' + context.search) : '';
          let replacedSection = await this.subpaths[dPath](context);
          let remainingSections = await Promise.all(afterSections.map(s => {
            let matcher = s.match(/[$]?:/)
            if (matcher) {
              let sectionName = s.replace(matcher[0], '').split('(')[0];
              if (matcher[0].startsWith('$')) {
                return this.subpaths[sectionName](context)
              } else {
                return context.params[sectionName] || s
              }
            }
            return s
          }))
          let forwardPath = `${[before, replacedSection, ...remainingSections].join('/')}${query}`;
          this.redirect(forwardPath);
        } catch (err) { throw err; }
      }]));
    }

    !isRecursive && this.registrar.push(routeHandle);
  }

  registerOn(window) {
    if (!window.attachedClientRouter) {
      this.domain = new Context(window.location.href).domain;
      let onclick = window.document.ontouchstart ? 'touchstart' : 'click';
      window.addEventListener(onclick, this._onClick.bind(this));
      window.addEventListener('popstate', this._onPopState.bind(this));
      window.attachedClientRouter = this;
      this.window = window;
      this.debug && console.log(`Router {${this.routerId}} registered to`, window, this);
    } else {
      throw new Error(`ClilentRouter::registerOn(): a router is already attached: ClientRouter {#${window.attachedClientRouter.routerId}}`)
    }
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
    this.evaluate(new Context(path, this.routerId));
  }
  
  _onPopState (e) {
    if (e.state && e.state.routerId === this.routerId) {
      this.evaluate(e.state);
    }
  }
  
  evaluate (context, replaceState) {
    if ((context.domain && this.domain === context.domain) || !context.domain) {
      for (let i = 0; i < this.registrar.length; i++) {
        if (this.registrar[i].matches(context)) {
          this.pushState(context, replaceState);
          return;
        }
      }
    }
    this.window.location = context.url;
  }
  
  pushState (context, replace = false) {
    if (!context.isRecordedHistory) {
      context.isRecordedHistory = true;
      if (replace) {
        this.window.history.replaceState(context, null, context.path)
      } else {
        this.window.history.pushState(context, null, context.path)
      }
    }
  }

  redirect (path) {
    this.evaluate(new Context(path, this.routerId), true);
  }

  navigate (path) {
    this.evaluate(new Context(path, this.routerId));
  }

  back () {
    this.window.history.back();
  }

  forward () {
    this.window.history.forward();
  }
}

  if (typeof module === 'object' && module.exports) {
    module.exports = {ClientRouter, Context, DerivedSubpath, RouteHandler, TokenizedPath}
  } else {
    Object.assign(window, {ClientRouter, Context, DerivedSubpath, RouteHandler, TokenizedPath})
  }


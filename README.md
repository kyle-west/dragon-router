# ClientRouter

![](https://travis-ci.com/kyle-west/client-router.svg?branch=master)

`ClientRouter` is an ExpressJS like client side router. It grabs a hold on the 
url when the user uses a link to navigate. This is intended to help progressive 
web apps manage the frontend independant of a server call. It uses the browser's
`history` API to control the pushing and poping of the page state.

It is also a work in progress. Stay tuned for better docs.

## Setup and usage

`ClientRouter` is an es6 class. Import it like you would any other module. After 
setting up your routes (See [below](#route-matching)), register the router on the
window. 

```js
import { ClientRouter } from 'client-router';
const router = new ClientRouter();

... // add route handling in here

router.registerOn(window);
router.start() // run this function after you have established routing rules, so the router knows it can immediately apply them
```

If you are using CommonJS, you may import the proper version from the `/dist` folder.

```js
const {ClientRouter} = require('client-router/dist/client-router.min.js')
```

Likewise, you can include it in your HTML from a `script` tag.

```html
<script src="/path/to/client-router/dist/client-router.min.js"></script>

OR

<script type="module" src="/path/to/client-router/dist/client-router.module.js"></script>
```

### Options

```js
let options = {
  basePath: '/my-app/base/route',    // mount the router off of a specific path     [default is '/']
  routerId: 'my-cool-client-router', // unique identifier between apps              [default is a random number]
  debug: true                        // show additional logging info                [default is false]
  registerOn: window                 // bind to the client's browser immediately    [if not given, `router.registerOn(...)` must be called separately]
}

const router = new ClientRouter(options);
```

## `ClientRoute.use()`

The `.use()` method allows us to apply matchers or behaviors to the routing. 

### Route matching

Route matching follows a similar pattern as Express. You can match literal routes
or a tokenized route that populates the `Context` with parameters.

```js
// render a page on a literal path matching
router.use('/about', renderYourAboutPageCB);
```

```js
router.use('/:section/:subSection', (context) => {
  
  // prefixing a path section with ':' will name that section in `context.params` 
  let section = context.params.section;
  let subSection = context.params.subSection;

  // now you can use the grepped data to apply on your app.
  renderYourPageCB(section, subSection);

});
```

You can append a parameter declaration with `(` `)` to specify a regex pattern
to enforce a match.

```js
router.use('/:section(home|about)/:subSection', (context) => {

  // now, the path will only ever match if the `section` is 'home' or 'about'
  let section = context.params.section;
  
  ...
});
```

Additionally, you may apply an array of matchers to a given handler.

```js
let matchingRoutes = ['/home/:subSection', '/about/:subSection'];

router.use(matchingRoutes, (context) => {
  // your code here
});
```

#### Optional Subpaths

Additional syntax of matchers includes `*` and `?` postfixes to sections.

The `*` postfix (e.g. `/your/route*`) will match any incoming route that is 
prefixed with the text before the `*` character.

The `?` postfix (e.g. `/your/:route?`) allows that section of the route to be 
optional. Unlike [Derived Subpaths](#derived-subpaths), these section values are
evaluated in the final callback of the middleware pipeline. 


### Derived Subpaths

A `DerivedSubpath` allows for a route to specify default values derived from a 
given callback. The callback for the DerivedSubpath can return an `async` object 
or a `String`. This is especially useful for forwarding to fully qualified paths 
in your app. 

Here is an example:

```js
let defaultSection = new DerivedSubpath('section', (context) => {
  return 'main'; // or whatever you need to do to compute the default `section`
})
router.use(defaultSection);

...

router.use('/page/$:section(main|about|contact)', renderPageSectionCB)
```

By this principle, the following are equivalent:

```js
router.use('/page', (context) => {
  router.redirect(`/page/main`);
})
router.use('/page/:section(main|about|contact)', (context) => {
  router.redirect(`/page/${context.params.section}/default`);
});
router.use('/page/:section(main|about|contact)/:subsection', renderPageCB);
```

and 

```js
router.use(new DerivedSubpath('section',    _ => 'main'));
router.use(new DerivedSubpath('subsection', _ => 'default'));
router.use('/page/$:section(main|about|contact)/$:subsection', renderPageCB);
```

The later being easier to read and understand by the developer than the former.

### Middleware

Middleware is a pipeline of functions that get applied when a matching route is 
rendered. A middleware function takes two parameters, `context`, and `next`. The `next`
argument is a function that envokes the next middleware in the pipeline. Naturally, 
 `next()` should not be called in the last function of the pipeline.

```js
let loggingMiddleware = (context, next) => {
  console.log('[ClientRouter]: navigating to ', context.path)
  next(); 
}

...

router.use('/:view', loggingMiddleware, renderYourAboutPageCB);
```

### `RouteHandler`

If you wish to make a particular handler reusable, you may form it as a `RouteHandler` for your convenience.

The constructor of `RouteHandler` takes two arguments: 
- [Matchers](#route-matching)
- And array of [middleware handlers](#middleware)

```js
let handler = new RouteHandler('/demo', [middleware1, middleware2, (context) => {
  // your handle here
}]);

router.use(handler);
```

# Removing the Router

In the event that you wish to remove the router from your application, you will need to first unregister it before deleting. 

```js
router.unregister()
delete router
```

# Using with ReactJS

With [Hooks](https://reactjs.org/docs/hooks-intro.html), integration into ReactJS is pretty simple. Below is an example on how to do so.

```jsx
// Import our router and the pages we want to client render
import React from 'react'
import { ClientRouter } from 'client-router'
import { DefaultPage, ExamplePage } from '../my-client-rendered-pages'

// This function sets up the router to select a page to render based off of the current path
function attachRouter (updatePage) {
  return () => {
    const router = new ClientRouter({ registerOn: window })
    router.use('/example', ctx => updatePage(<ExamplePage context={ctx} />))
    router.use('*',        ctx => updatePage(<DefaultPage context={ctx} />))
    router.start()
  }
}

// Now our app conditionally renders pages based off of the route we are on
export default function App ({}) {
  const [page, updatePage] = React.useState(<DefaultPage />)
  React.useEffect(attachRouter(updatePage), [])

  return <div>{page}</div>
}
```
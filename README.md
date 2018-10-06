# ClientRouter

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
import { ClientRouter } from '../client-router.js';
const router = new ClientRouter();

... // add route handling in here

router.registerOn(window);    
```

### Options

`<<<<<<<<<<<<<<<<<<<<< TODO >>>>>>>>>>>>>>>>>>>>`
```js
let options = {
  routerId: 'my-cool-client-router', // unique identifier between apps
  debug: true,                       // show additional logging info
}

const router = new ClientRouter(options);
```


### Route matching

Route matching follows a similar pattern as express. You can match literal routes
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

### Middleware
`<<<<<<<<<<<<<<<<<<<<< TODO >>>>>>>>>>>>>>>>>>>>`

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

`<<<<<<<<<<<<<<<<<<<<< TODO >>>>>>>>>>>>>>>>>>>>`

### Middleware
`<<<<<<<<<<<<<<<<<<<<< TODO >>>>>>>>>>>>>>>>>>>>`

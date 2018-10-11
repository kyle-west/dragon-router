import { ClientRouter, RouteHandler, DerivedSubpath } from '../client-router.js';
let router = new ClientRouter({ routerId: 'demo-router', debug: true });


const middleware1 = (context, next) => {
  console.log("CLIENT-SIDE ROUTING TO: ", context.path);
  context.logged = true; // should modify the context for the next middleware
  next();
};
const middleware2 = (context, next) => {
  console.log('{PARAMS}:', context.params);
  next();
};


let demoRouteHandler = new RouteHandler('/demo', [middleware1, middleware2, (context) => {
  document.getElementById('page-title').innerHTML = "DEMO";
}]);

router.use(demoRouteHandler);


router.use('/page', middleware1, middleware2, (context) => {
  document.getElementById('page-title').innerHTML = "Default Page";
});

router.use(`/page/:num`, middleware1, middleware2, (context) => {
  document.getElementById('page-title').innerHTML = "Page " + context.params.num;
});

router.use(`/:section(about|contact)`, middleware1, middleware2, (context) => {
  document.getElementById('page-title').innerHTML = context.params.section + " page";
});

router.use(`/:section(about|contact)/:subsection`, middleware1, middleware2, (context) => {
  document.getElementById('page-title').innerHTML = context.params.section + " page | " + context.params.subsection;
});

router.use(new DerivedSubpath('subsection', (context) => {
  return Promise.resolve('default-path');
}))

router.use(`/derived-subpath/$:subsection`, middleware1, middleware2, (context) => {
  document.getElementById('page-title').innerHTML = "DerivedSubpath: " + context.params.subsection;
});


router.use(new DerivedSubpath('first', (context) => {
  return Promise.resolve('abc');
}))
router.use(new DerivedSubpath('second', (context) => {
  return 'sub-sub-page';
}))
router.use(new DerivedSubpath('third', (context) => {
  return 's0';
}))

router.use(`/multi-derived-subpath/$:first(abc|123)/$:second/$:third`, middleware1, middleware2, (context) => {
  document.getElementById('page-title').innerHTML = "Muiltiple DerivedSubpath: " 
    + context.params.first + " -> " 
    + context.params.second + " -> " 
    + context.params.third;
});

router.registerOn(window);
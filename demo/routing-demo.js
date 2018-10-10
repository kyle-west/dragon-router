import { ClientRouter } from '../client-router.js';
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


router.use('/demo', middleware1, middleware2, (context) => {
  document.getElementById('page-title').innerHTML = "DEMO";
});
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

router.registerOn(window);
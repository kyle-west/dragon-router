['./dist/client-router', './dist/client-router.min'].forEach(distFile => {
  const {ClientRouter, Context, DerivedSubpath, RouteHandler, TokenizedPath} = require(distFile)
  const router = new ClientRouter({registerOn: window});
  
  const middleware1 = (ctx, next) => { ctx.params.middleware1 = true; next(); }
  const middleware2 = (ctx, next) => { ctx.params.middleware2 = true; next(); }
  const middleware3 = (ctx, next) => { ctx.params.middleware3 = true; next(); }
  
  test(`${distFile} :: We can get all the class definitions out of the package`, () => {
    [ClientRouter, Context, DerivedSubpath, RouteHandler, TokenizedPath].forEach(classDefinition => {
      expect(classDefinition).toBeDefined();
    });
  });
  
  test(`${distFile} :: We can define literal matchers`, () => {
    router.use('/user', (context) => {
      expect(context.path).toBe('/user');
    })
  
    router.navigate('/user')
  });
  
  test(`${distFile} :: We can define section parameters`, () => {
    router.use('/user/:section(info|settings)', (context) => {
      expect(['info', 'settings']).toContain(context.params.section);
    })
  
    router.navigate('/user/info')
    router.navigate('/user/settings')
  });
  
  test(`${distFile} :: We can define optional parameters`, () => {
    router.use('/about/:person?', (context) => {
      expect([undefined, 'sally', 'sam']).toContain(context.params.person);
    })
  
    router.navigate('/about/')
    router.navigate('/about/sally')
    router.navigate('/about/sam')
  });
  
  test(`${distFile} :: We can define star routes`, () => {
    router.use('/home*', (context) => {
      expect(context.path).toMatch(/^\/home.*$/);
    })
  
    router.navigate('/home')
    router.navigate('/homer')
    router.navigate('/home/test')
  });
  
  test(`${distFile} :: We can add middleware that can manipulate the Context`, () => {
    router.use('/test/middleware', middleware1, middleware2, middleware3, (context) => {
      expect(context.params).toMatchObject({
        middleware1 : true, middleware2 : true, middleware3 : true
      });
    })
  
    router.navigate('/test/middleware')
  });
  
  test(`${distFile} :: We can use route handlers`, () => {
    let handler = new RouteHandler('/test/route-handler', [middleware1, middleware2, middleware3, (context) => {
      expect(context.params).toMatchObject({
        middleware1 : true, middleware2 : true, middleware3 : true
      });
    }]);
    router.use(handler)
  
    router.navigate('/test/route-handler')
  });
  
  test(`${distFile} :: We can use derived subpaths`, () => {
    router.use(new DerivedSubpath('fillThisPartIn', () => 'this-part-was-filled-in'))
    router.use('/test/$:fillThisPartIn/:rest(the-rest-of-the-path)', (context) => {
      expect(context.path).toBe('/test/this-part-was-filled-in/the-rest-of-the-path');
    })
  
    router.navigate('/test/the-rest-of-the-path')
    router.navigate('/test/this-part-was-filled-in/the-rest-of-the-path')
  });

  delete window.attachedClientRouter
})

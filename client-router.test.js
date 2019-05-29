const {ClientRouter, Context, DerivedSubpath, RouteHandler, TokenizedPath} = require('./dist/client-router')

test('We can get all the class definitions out of the package', () => {
  [ClientRouter, Context, DerivedSubpath, RouteHandler, TokenizedPath].forEach(classDefinition => {
    expect(classDefinition).toBeDefined();
  });
});
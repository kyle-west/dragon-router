# Upcoming development ideas

The following are suggestions that may (or may not) be implmented. These ideas 
will be recorded for later project ideas in the form of docs to aid in our goal
of Design Driven Development. Features described in this document will be moved
to the main README.md file once support is added.

## Derived Subpaths

A `DerivedSubpath` will namespace a subroute default derivation to a fully 
qualified path.

Prefixing a tokenized route with `$` will envoke that DerivedSubpath callback 
used by the router, and replace that part of the path with the derived value 
from the callback.


```js
let defaultSection = new DerivedSubpath('section', (context) => {
  return 'main'; // or whatever you need to do to compute the default `section`
})
router.use(defaultSection);

...

router.use('/page/$:section(main|about|contact)', renderPageSectionCB)
```
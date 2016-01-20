<div align="center">
  <img src="https://raw.githubusercontent.com/cr0cK/bouchon/assets/assets/images/bouchon-icon.png" />
</div>

# bouchon

Efficient API mocking with cool libraries.

## Summary

- [Big picture](#big-picture)


## Big picture

Bouchon provides a way to make mocks easily with [redux](https://github.com/rackt/redux) and
[reselect](https://github.com/rackt/reselect).

Redux keeps your API stateful in order to create/edit/delete objects in your fake API and
reselect allows to retrieve any data from that state.

You define some data in a JSON file and your actions/reducers/selectors/middlewares/routes in a JS file.
These two files [constitue] a fixture.

Each route (HTTP Verb + url) defines an action, a selector and some optionnal middlewares.


## Basic example

Follow the following instructions to make your first fixture.

Start an empty projet and create some folders and files:

```
$ mkdir fake-api && cd $_
$ npm init
$ npm install bouchon --save-dev
$ mkdir fixtures/1-articles && cd $_
$ touch data.json && touch articles.fixture.js
```

### JSON data

Each fixture defines a JSON files with some data:

```
// data.json

[
  {
    "id": 1,
    "title": "cillum eu esse",
    "body": "Culpa in duis mollit ullamco minim quis ullamco eu.",
    "date_created": "Tuesday, October 20, 2015 2:34 PM",
    "author_id": 1
  },
  {
    "id": 2,
    "title": "voluptate labore cillum",
    "body": "Veniam tempor mollit qui do quis ex. Anim fugiat adipisicing officia eiusmod.",
    "date_created": "Thursday, October 23, 2014 1:34 PM",
    "author_id": 2
  }
```

### Actions

In order to limit the boilerplate, bouchon uses [redux-act](https://github.com/pauldijou/redux-act)
that provides a simpler API to create actions and reducers. No types and switch cases are required.

```js
// articles.fixture.js

import { createAction } from 'bouchon';

const actions = {
  get: createAction('Retrieve articles'),
  post: createAction('Create an article'),
  patch: createAction('Update an article'),
  delete: createAction('Delete an article'),
};
```

### Reducers

Each route defined in your fixture will

### Selectors

### Start bouchon


## Advanced usage

### Asynchronous actions

### Delays

### Middlewares

### Combine fixtures

### Use Babel for your fixture


## Using Bouchon in integration tests

### Bouchon API























Selectors allow to select a part of your state. They are customisable, composable, exportable, etc.

The idea is to split your data into several fixtures and write selectors that can be reusable.

For example, if you want to return one article from an url such `/articles/1`, you can write a selector like this:

```js
import { createSelector } from 'bouchon';

const selectors = {};

// params are the merge of querystring, matched and body parameters
selectors.all = (/* params */) => state => state.articles;

selectors.byId = ({id}) => createSelector(
  selectors.all(),
  articles => articles.filter(article => Number(article.id) === Number(id)).pop(),
);
```

bouchon is providing `createSelector` from the reselect library.
For more information about reselect, read [the documentation](https://github.com/rackt/reselect).

bouchon-toolbox is providing some common selectors like `selectRows` and `extendRows`:

```js
import { selectRows, extendRows } from 'bouchon-toolbox';

export const selectors = {};

// return all articles
selectors.all = () => state => state.articles;

// use the extendRows function of the toolbox to add the author data to each article
// Could be translated by:
// "Join the 'author_id' key of the first selector with the 'id' key of the second selector,
// and set the result in the 'author' key of the first selector".
selectors.allWithAuthor = () => extendRows(
  selectors.all, 'author_id',
  authorsSelectors.all, 'id',
  'author'
);

// use the selectRows function of the toolbox to filter results
selectors.byId = ({id}) => selectRows(selectors.allWithAuthor(), 'id', id);
```

Check [the full sample](https://github.com/cr0cK/bouchon-samples/tree/master/samples/2-articles-with-author) for a complete overview.

For more information about `selectRows` and `extendRows`, check the documentation of the [bouchon-toolbox](https://github.com/cr0cK/bouchon-toolbox).

### Middlewares

You certainly know how Express middlewares work? bouchon supports middlewares in the same way.

For example, if you want a complete solution for pagination, you can easily write a middleware like this:

```js
// data is the selected data from your selector
const setPaginationHeaders = data => (req, res, next) => {
  const page = req.query.page || 1;
  const perPage = req.query.perPage || 10;
  const pageCount = Math.ceil(data.length / perPage);
  const totalCount = data.length;
  const slicedData = data.slice(
    (page - 1) * perPage,
    page * perPage
  );

  const headers = {
    'x-page': page,
    'x-per-page': perPage,
    'x-page-count': pageCount,
    'x-total-count': totalCount,
  };

  // if data are set in the response object, bouchon will return that data instead of those selected by your selector
  res.data = slicedData;

  // set pagination headers
  res.set(headers);

  // do not forget to call next to continue the chain
  next();
};
```

Check [middlewares](https://github.com/cr0cK/bouchon-toolbox) from the toolbox.

### Fixtures

When starting, bouchon is looking every `*.fixture.js` file and load it. Each fixture file describe how actions / reducers / selectors will respond to your defined routes.

#### `articles.fixture.js`

```js
import { createAction, createSelector } from 'bouchon';
import { reducers, selectors as selectors_ } from 'bouchon-toolbox';

const { retrieve } = reducers;
const { selectRows } = selectors_;


/**
 * Define your actions.
 * For less boilerplate, bouchon is using redux-act.
 */

const actions = {
  get: createAction(),
};

/**
 * Define your selectors in charge to retrieve data from the state.
 * You can compose them, export them to use them in another fixtures, etc.
 * Have a look to reselect library for more information.
 */

export const selectors = {};

selectors.all = (/* params */) => state => state.articles;

selectors.byId = ({id}) => selectRows(selectors.all(), 'id', id);


/**
 * Finally, define your fake API!
 * Important: you have to use a 'default export'.
 */

export default {
  // will be used to save data in `state.articles`
  name: 'articles',
  data: require('./data.json'),
  // define your reducer according to the action
  reducer: ({
    [actions.get]: state => retrieve(state),
  }),
  // define for each route the action to emit and the selector to use
  routes: {
    'GET /': {
      action: actions.get,
      selector: selectors.all,
      // optional middlewares
      middlewares: [setPaginationHeaders],
      status: 200,
    },
    'GET /:id': {
      // random delay between 0 and 2000 ms
      action: {action: actions.get, delay: [0, 2000]},
      selector: selectors.byId,
      status: 200,
    },
  },
  endpoint: 'articles',
};
```

Of course, you can write your fixture in ES5, even if it's much more verbose. [Have a look of the same example written in ES5](https://github.com/cr0cK/bouchon-samples/blob/master/samples/1-articles/articles/index-es5.js).

Then just start bouchon like this:

```bash
$ ./node_modules/.bin/bouchon -d ./path/to/my/fixtures [-p port]
```

If you want more samples, have a look of more complex use cases in the [bouchon-samples repository](https://github.com/cr0cK/bouchon-samples).

## Backend actions

In some use cases, processes can be asynchronous: an API call can just respond "OK", save your request in a queue and later, a process will process your demand.
Bouchon provides a feature named 'backendAction' that allows to dispatch an action in the future in order to simulate a backend activity.

```js
const actions = {
  postBackend: createAction('POST_BACKEND_ARTICLES'),
};

export default {
  name: 'articles',
  data: require('./data.json'),
  reducer: ({
    [actions.postBackend]: (state, params) => create(state, params.body, ArticleSchema),
  }),
  endpoint: 'articles',
  routes: {
    'POST /': {
      // instead of an action, it's possible to return arbitrary data that does not come from the state
      responseBody: {
        operationId: 123456,
        status: 'RUNNING',
      },
      // then, define a `backendAction` that will emit the `actions.postBackend` action in 2 seconds
      backendAction: {action: actions.postBackend, delay: 2000},
      // no need to define an action or a selector since we return arbitrary data
      // action: N/A,
      // selector: N/A,
      status: 201,
    },
  },
};
```

Results:

![Backend actions logs](https://raw.githubusercontent.com/cr0cK/bouchon/assets/assets/images/backend-action-logs.png)


## Combine fixtures

If you are already familiar with Redux, you certainly know how `combineReducers` work.

bouchon is providing similar helpers to combine reducers and routes:

```js
import { combineFixturesReducers, combineFixturesRoutes } from 'main';

import books from './books';
import authors from './authors';

export default {
  name: 'paris',
  endpoint: 'paris',
  reducer: combineFixturesReducers({
    books,
    authors,
  }),
  routes: combineFixturesRoutes({
    books,
    authors,
  }),
};
```

You can even use `combineFixtures` for a more compact code (laziness for the win).

```js
import { combineFixtures } from 'main';

import books from './books';
import authors from './authors';

export default {
  name: 'paris',
  endpoint: 'paris',
  ...combineFixtures({
    books,
    authors,
  }),
};
```






## bouchon API

bouchon is providing an API useful for integration tests.

For example, to test an app in a browser, you can start bouchon at the beginning of the test, execute your test with a Selenium based tool and stop bouchon at the end.

Bonus: bouchon is recording all actions done during the test so you can check that your process did exactly what you are expected at the end of your test.


```js
import path from 'path';
import chai from 'chai';
import freeport from 'freeport';
import request from 'request';
import { api as bouchon } from 'bouchon';


const expect = chai.expect;

describe('1 - List articles', function test() {
  this.timeout(10000);
  this.port = undefined;

  before((done) => {
    freeport((err, port) => {
      this.port = port;
      const pathFixtures = path.resolve(__dirname);
      bouchon.server.start({ path: pathFixtures, port })
        .then(() => done())
        .catch(done);
    });
  });

  after((done) => {
    expect(bouchon.logs.get()).to.deep.equal([{
      method: 'GET',
      originalUrl: '/articles',
      statusCode: 200,
      query: {},
      params: {},
      body: {},
    }]);

    bouchon.server.stop()
      .then(() => done())
      .catch(done);
  });

  it('should return articles', (done) => {
    request(`http://localhost:${this.port}/articles`, (err, res, body) => {
      if (err) { done(err); }

      expect(JSON.parse(body).length).to.equal(25);
      done();
    });
  });
});
```

### List of methods

```
- bouchon.start.start({path, port})    // start the server, return a promise
- bouchon.start.stop()                 // stop the server, return a promise
- bouchon.logs.get()                   // return the logs saved since the server has been started
- bouchon.logs.reset()                 // return the logs
```

## Installation

```
npm install --save bouchon
```

## Other related packages

- [bouchon-toolbox](https://github.com/cr0cK/bouchon-toolbox): a set of useful reducers, selectors and middlewares for common use cases
- [bouchon-samples](https://github.com/cr0cK/bouchon-samples): some examples for inspiration

## License

MIT.

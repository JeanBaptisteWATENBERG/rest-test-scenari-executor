# REST Test scenari executor

The goal of this project is to read a test scenario from a json file 
and execute the tests against the REST ressources.

This is an experiment based on [Jest](https://facebook.github.io/jest/) and [Frisby](https://www.frisbyjs.com/).

## Set the scenario

In [index.spec.ts](/src/index.spec.ts) file, replace `require('../scenari/json-placeholder-post.json')` by the scenario spec you want to execute.

You can find some scenario spec samples in the [scenari](/scenari) folder.

## Run the tests

```sh
npm run test
```
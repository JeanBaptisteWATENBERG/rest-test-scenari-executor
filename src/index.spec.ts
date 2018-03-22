import { ScenarioDescription } from './models/ScenarioDescription';
import { AuthenticationScenarioItem, BasicAuthenticationScenarioItem } from './models/ScenarioItem';
import { evalContentVariable, expectAssertAsJest, assertHeader, assertBody } from './utils';
import { evalPathParameters, buildPathWithParameters } from './pathUtils';
import { evalQueryParameters, buildPathWithQueryParams } from './queryParamsUtils';
import { evaluateBody } from './bodyUtils';

const jp = require('jsonpath');
const frisby = require('frisby');

const scenarioDescription: ScenarioDescription = require('../scenari/json-placeholder-post.json');

const extractedVariables: any = {};
let authenticationItem: AuthenticationScenarioItem;

const evalAuthHeaders = () => {
  const authenticationHeaders: any = {};
  if (authenticationItem && authenticationItem.authenticationType === 'basic') {
    const basicAuthenticationItem: BasicAuthenticationScenarioItem = authenticationItem as BasicAuthenticationScenarioItem;
    authenticationHeaders.authorization = 'Basic ' + new Buffer(`${basicAuthenticationItem.username}:${basicAuthenticationItem.password}`).toString('base64');
  }
  return authenticationHeaders;
}

const expectResponseToBeOfJSONFormat = (res: any, expect: any) => {
  expect(res.headers.get('Content-Type')).toBeDefined();
  expect(res.headers.get('Content-Type')).toContain('application/json');
  expect(res.json).toBeDefined();
}

const createTestForScenarioItem = (scenarioItem) => {
  const baseUrl = scenarioItem.url;
  const path = scenarioItem.operation.path;
  const operationId = scenarioItem.operation.operationId;
  const summary = scenarioItem.operation.summary;
  it(`${operationId} (${path}) should ${summary.toLowerCase()}`, done => {
    const authenticationHeaders: any = evalAuthHeaders();
    const pathParameters = evalPathParameters(scenarioItem, extractedVariables);
    const pathWithParameters = buildPathWithParameters(path, pathParameters);
    const queryParams = evalQueryParameters(scenarioItem, extractedVariables);
    const pathWithQueryParams = buildPathWithQueryParams(queryParams, pathWithParameters);
    const parameterHeaders: any = {};
    const body = evaluateBody(scenarioItem, parameterHeaders, extractedVariables);

    frisby
      .fetch(`${baseUrl}${pathWithQueryParams}`, {
        method: scenarioItem.operation.method,
        headers: {
          accept: scenarioItem.accept,
          ...authenticationHeaders,
          ...parameterHeaders
        },
        body
      })
      // .inspectRequest()
      .then((res) => {
        if (scenarioItem.accept !== 'application/json') {
          throw new Error(`Content type ${scenarioItem.accept} is not yet supported`);
        }

        expectResponseToBeOfJSONFormat(res, expect);

        scenarioItem.asserts.forEach(assertion => {
          if (assertion.in === 'header') {
            assertHeader(assertion, res, extractedVariables);
          } else if (assertion.in === 'body') {
            assertBody(assertion, res, extractedVariables);
          }
        });

        if (scenarioItem.extracts) {
          scenarioItem.extracts.forEach(extraction => {
            if (extraction.in === 'header') {
              extractedVariables[extraction.as] = res.headers.get(extraction.field);
            } else if (extraction.in === 'body') {
              const extractedValues = jp.query(res.json, extraction.field);
              if (extractedValues.length > 0) {
                extractedVariables[extraction.as] = extractedValues[0];
              } else {
                throw new Error(`Failed to extract variable ${extraction.as} with JSONPath ${extraction.field}`);
              }
            }
          });
        }

        done();
      });
  });
}

describe(scenarioDescription.name, () => {
  scenarioDescription.scenario.forEach(scenarioItem => {
    if (scenarioItem.type === 'authentication') {
      authenticationItem = scenarioItem;
    } else if (scenarioItem.type === 'path') {
      createTestForScenarioItem(scenarioItem);
    }
  })
});

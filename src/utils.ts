import jp = require('jsonpath');
import fetch from 'node-fetch';
import { evaluateBody } from './bodyUtils';
import { jsonExpect } from './jsonExpect';
import { IAssertion } from './models/Assertion';
import { IBasicAuthenticationScenarioItem } from './models/ScenarioItem';
import { buildPathWithParameters, evalPathParameters } from './pathUtils';
import { buildPathWithQueryParams, evalQueryParameters } from './queryParamsUtils';

const variableRegexp = /.*\$\{([a-zA-Z0-9]+)\}.*/;

export const evalContentVariable = ({variables, content}: {variables: any, content: string}) => {
  const match = variableRegexp.exec(content);
  if (match) {
    const variableName = match[1];
    if (variables[variableName]) {
      return evalContentVariable({
        content: content.replace('${' + variableName + '}', variables[variableName]),
        variables,
      });
    } else {
      throw new Error(`Variable ${variableName} has not yet been initialized`);
    }
  }
  return content;
};

export const expectAssertAsJest = ({
  evaluatedVariables,
  expectBaseFunction,
  receivedValue,
  assertionDefinition,
}: {
  evaluatedVariables: any,
  expectBaseFunction: any,
  receivedValue: any,
  assertionDefinition: IAssertion,
}) => {
  const expecting = evalContentVariable({
    content: assertionDefinition.expect,
    variables: evaluatedVariables,
  });
  if (!expecting) {
    return;
  }
  switch (assertionDefinition.type) {
    case 'present':
      return expectBaseFunction.toBeDefined();
    case 'notEquals':
      expectBaseFunction = expectBaseFunction.not;
    case 'equals':
      const receivedType = typeof receivedValue;
      let expection: any = expecting;
      if (receivedType === 'number') {
        expection = parseFloat(expecting);
      } else if (receivedType === 'boolean') {
        // tslint:disable-next-line:triple-equals -- this is expecting behavior to be able to compare with string cast
        expection = expecting == 'true';
      }
      return expectBaseFunction.toEqual(expection);
    case 'notContains':
      expectBaseFunction = expectBaseFunction.not;
    case 'contains':
      return expectBaseFunction.toContain(expecting);
    case 'gt':
      return expectBaseFunction.toBeGreaterThan(parseFloat(expecting));
    case 'gte':
      return expectBaseFunction.toBeGreaterThanOrEqual(parseFloat(expecting));
    case 'lt':
      return expectBaseFunction.toBeLessThan(parseFloat(expecting));
    case 'lte':
      return expectBaseFunction.toBeLessThanOrEqual(parseFloat(expecting));
    default:
      throw new Error(`Assertion type ${assertionDefinition.type} is not supported`);
  }
};

export const assertHeader = ({
  assertionDefinition,
  fetchResponse,
  evaluatedVariables,
}: {
  assertionDefinition: IAssertion,
  fetchResponse: any,
  evaluatedVariables: any,
}) => {
  if (assertionDefinition.field === 'status') {
    if (assertionDefinition.type) {
      return expectAssertAsJest({
        assertionDefinition,
        evaluatedVariables,
        expectBaseFunction: jsonExpect(fetchResponse.status),
        receivedValue: fetchResponse.status,
      });
    }
  } else if (assertionDefinition.field) {
    return expectAssertAsJest({
      assertionDefinition,
      evaluatedVariables,
      expectBaseFunction: jsonExpect(fetchResponse.headers.get(assertionDefinition.field)),
      receivedValue: fetchResponse.headers.get(assertionDefinition.field),
    });
  } else {
    throw new Error('A header assertion must mention a field');
  }
};

export const assertBody = ({
  assertionDefinition,
  rawTextResponse,
  evaluatedVariables,
}: {
  assertionDefinition: IAssertion,
  rawTextResponse: any,
  evaluatedVariables: any,
}) => {
  if (assertionDefinition.field) {
    const fieldToAssert = jp.query(JSON.parse(rawTextResponse), assertionDefinition.field);
    if (fieldToAssert.length > 0) {
      return expectAssertAsJest({
        assertionDefinition,
        evaluatedVariables,
        expectBaseFunction: jsonExpect(fieldToAssert[0]),
        receivedValue: fieldToAssert[0],
      });
    } else {
      throw new Error(`Failed to compute JSONPath ${assertionDefinition.field}`);
    }
  } else {
    return expectAssertAsJest({
      assertionDefinition,
      evaluatedVariables,
      expectBaseFunction: jsonExpect(rawTextResponse),
      receivedValue: rawTextResponse,
    });
  }
};

export const evalAuthHeaders = (authenticationItem) => {
  const authenticationHeaders: any = {};
  if (authenticationItem && authenticationItem.authenticationType === 'basic') {
    const basicAuthenticationItem: IBasicAuthenticationScenarioItem =
      authenticationItem as IBasicAuthenticationScenarioItem;
    const basicToken =
      new Buffer(`${basicAuthenticationItem.username}:${basicAuthenticationItem.password}`)
        .toString('base64');
    authenticationHeaders.authorization = `Basic ${basicToken}`;
  }
  return authenticationHeaders;
};

export const expectResponseToBeOfJSONFormat = async ({
  expectionFramework,
  fetchResponse,
}: {
  expectionFramework: any,
  fetchResponse: any,
}) => {
  return [
    expectionFramework(fetchResponse.headers.get('Content-Type')).toBeDefined(),
    expectionFramework(fetchResponse.headers.get('Content-Type')).toContain('application/json'),
  ];
};

export const getCurrentTimeInMillis = () => {
  const now = new Date();
  return now.getTime();
};

export const createTestForScenarioItem = async ({
  scenarioItem,
  currentAuthenticationItem,
  currentlyExtractedVariables,
}) => {
  const baseUrl = scenarioItem.url;
  const path = scenarioItem.operation.path;
  const authenticationHeaders: any = evalAuthHeaders(currentAuthenticationItem);
  const pathParameters = evalPathParameters(scenarioItem, currentlyExtractedVariables);
  const pathWithParameters = buildPathWithParameters(path, pathParameters);
  const queryParams = evalQueryParameters(scenarioItem, currentlyExtractedVariables);
  const pathWithQueryParams = buildPathWithQueryParams(queryParams, pathWithParameters);
  const parameterHeaders: any = {};
  const body = evaluateBody(scenarioItem, parameterHeaders, currentlyExtractedVariables);

  const startTime = getCurrentTimeInMillis();

  return await fetch(`${baseUrl}${pathWithQueryParams}`, {
    body,
    headers: {
      accept: scenarioItem.accept,
      ...authenticationHeaders,
      ...parameterHeaders,
    },
    method: scenarioItem.operation.method,
  }).then(async (res) => {
    const endTime = getCurrentTimeInMillis();
    scenarioItem.responseTimeInMillis = endTime - startTime;

    if (scenarioItem.accept !== 'application/json') {
      throw new Error(`Content type ${scenarioItem.accept} is not yet supported`);
    }

    const textResponse = await res.text();

    const jsonBodyAssertResults = await expectResponseToBeOfJSONFormat({
      expectionFramework: jsonExpect,
      fetchResponse: res,
    }) || [];

    scenarioItem.asserts = scenarioItem.asserts.map((assertion) => {
      if (assertion.in === 'header') {
        assertion.result = assertHeader({
          assertionDefinition: assertion,
          evaluatedVariables: currentlyExtractedVariables,
          fetchResponse: res,
        });
      } else if (assertion.in === 'body') {
        assertion.result = assertBody({
          assertionDefinition: assertion,
          evaluatedVariables: currentlyExtractedVariables,
          rawTextResponse: textResponse,
        });
      }
      return assertion;
    });

    scenarioItem.asserts.push({
      field: 'Content-Type',
      in: 'header',
      result: jsonBodyAssertResults[0],
      type: 'present',
    });

    scenarioItem.asserts.push({
      expect: 'application/json',
      field: 'Content-Type',
      in: 'header',
      result: jsonBodyAssertResults[1],
      type: 'contains',
    });

    if (scenarioItem.extracts) {
      scenarioItem.extracts = scenarioItem.extracts.map((extraction) => {
        if (extraction.in === 'header') {
          const extractionResult = res.headers.get(extraction.field);
          currentlyExtractedVariables[extraction.as] = extractionResult;
          extraction.result = extractionResult;
        } else if (extraction.in === 'body') {
          const extractedValues = jp.query(JSON.parse(textResponse), extraction.field);
          if (extractedValues.length > 0) {
            currentlyExtractedVariables[extraction.as] = extractedValues[0];
            extraction.result = extractedValues[0];
          } else {
            extraction.error = `Failed to extract variable ${extraction.as} with JSONPath ${extraction.field}`;
          }
        }
        return extraction;
      });
    }

    return scenarioItem;
  });
};

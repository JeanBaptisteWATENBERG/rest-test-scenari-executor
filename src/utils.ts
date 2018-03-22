import { Assertion } from './models/Assertion';
const jp = require('jsonpath');

const variableRegexp = /.*\$\{([a-zA-Z0-9]+)\}.*/;

export const evalContentVariable = (variables: any, content: string) => {
  const match = variableRegexp.exec(content);
  if (match) {
    const variableName = match[1];
    if (variables[variableName]) {
      return evalContentVariable(variables, content.replace('${' + variableName + '}', variables[variableName]));
    } else {
      throw new Error(`Variable ${variableName} has not yet been initialized`);
    }
  }
  return content;
}

export const expectAssertAsJest = (extractedVariables, buildingExpect, resPart, assertion: Assertion) => {
  const expecting = evalContentVariable(extractedVariables, assertion.expect);
  if (!expecting) {
    return;
  }
  switch(assertion.type) {
    case 'present':
      buildingExpect.toBeDefined();
      break;
    case 'notEquals':
      buildingExpect = buildingExpect.not;
    case 'equals':
      const receivedType = typeof resPart;
      let expection: any = expecting;
      if (receivedType === 'number') {
        expection = parseFloat(expecting);
      } else if (receivedType === 'boolean') {
        expection = expecting == 'true';
      }
      buildingExpect.toEqual(expection);
      break;
    case 'notContains':
      buildingExpect = buildingExpect.not;
    case 'contains':
      buildingExpect.toContain(expecting);
      break;
    case 'gt':
      buildingExpect.toBeGreaterThan(parseFloat(expecting));
      break;
    case 'gte':
      buildingExpect.toBeGreaterThanOrEqual(parseFloat(expecting));
      break;
    case 'lt':
      buildingExpect.toBeLessThan(parseFloat(expecting));
      break;
    case 'lte':
      buildingExpect.toBeLessThanOrEqual(parseFloat(expecting));
      break;
  }
}

export const assertHeader = (assertion: any, res: any, variables: any) => {
  if (assertion.field === 'status') {
    if (assertion.type)
      expectAssertAsJest(variables, expect(res.status), res.status, assertion);
  }
  else if (assertion.field) {
    expectAssertAsJest(variables, expect(res.headers.get(assertion.field)), res.headers.get(assertion.field), assertion);
  }
  else {
    throw new Error('A header assertion must mention a field');
  }
}

export const assertBody = (assertion: any, res: any, variables: any) => {
  if (assertion.field) {
    const fieldToAssert = jp.query(res.json, assertion.field);
    if (fieldToAssert.length > 0) {
      expectAssertAsJest(variables, expect(fieldToAssert[0]), fieldToAssert[0], assertion);
    }
    else {
      throw new Error(`Failed to compute JSONPath ${assertion.field}`);
    }
  }
  else {
    expectAssertAsJest(variables, expect(res.body), res.body, assertion);
  }
}
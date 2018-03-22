import { evalContentVariable } from "./utils";

export const evalPathParameters = (scenarioItem, variables) =>
  scenarioItem.operation.parameters ?
    scenarioItem.operation.parameters
      .filter(param => param.in === 'path')
      .map(param => {
        return {
          name: param.name,
          value: evalContentVariable(variables, param.schema['x-value'])
        };
      })
    : null;

export const buildPathWithParameters = (path: any, pathParameters: any) => {
  let pathWithParameters = path;
  if (pathParameters) {
    pathParameters.forEach(param => {
      if (param.value) {
        pathWithParameters = pathWithParameters.replace(`{${param.name}}`, param.value);
      }
    });
  }
  return pathWithParameters;
}
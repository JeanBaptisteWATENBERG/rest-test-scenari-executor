import { evalContentVariable } from "./utils";

export const evaluateBody = (scenarioItem: any, parameterHeaders: any, variables: any) => {
    let body;
    if (scenarioItem.operation.requestBody) {
      const requestContent = scenarioItem.operation.requestBody.content;
      const requestContentType = Object.keys(requestContent)[0];
      switch (requestContentType) {
        case 'application/json':
          parameterHeaders['Content-Type'] = 'application/json';
          body = evalContentVariable(variables, requestContent[requestContentType].schema['x-value']);
          break;
        default:
          throw new Error(`Content-type ${requestContentType} is not yet supported`);
      }
    }
    return body;
  }
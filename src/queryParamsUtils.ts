import { evalContentVariable } from './utils';

export const evalQueryParameters = (scenarioItem, variables) => {
  return scenarioItem.operation.parameters ?
    scenarioItem.operation.parameters.filter((p) => p.in === 'query')
      .map((p) => {
        if (p.schema['x-value']) {
          return {
            name: p.name,
            value: evalContentVariable({
              content: p.schema['x-value'],
              variables,
            }),
          };
        }
        return null;
      }) : [];
};

export const buildPathWithQueryParams = (queryParams: any, pathWithParameters: any) => {
  const query = queryParams
    .filter((p) => p !== null)
    .map((p) => encodeURIComponent(p.name) + '=' + encodeURIComponent(p.value))
    .join('&');
  if (query) {
    pathWithParameters += `?${query}`;
  }
  return pathWithParameters;
};

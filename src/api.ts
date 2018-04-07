import { IScenarioDescription } from './models/ScenarioDescription';
import { IAuthenticationScenarioItem } from './models/ScenarioItem';
import { createTestForScenarioItem } from './utils';

import bodyParser = require('body-parser');
import express = require('express');

const app = express();

// parse application/json
app.use(bodyParser.json());

app.post('/scenari/run', async (req, res) => {
  const scenarioDescription: IScenarioDescription = req.body;
  const currentlyExtractedVariables: any = {};
  let currentAuthenticationItem: IAuthenticationScenarioItem;

  const scenarioPromise = new Promise((resolve) => {
    const exec = ({ scenarioItemResults = [], scenarioItemIndex = 0 } = {}) => {
      if (scenarioItemIndex === scenarioDescription.scenario.length) {
        resolve(scenarioItemResults);
        return;
      }
      const scenarioItem = scenarioDescription.scenario[scenarioItemIndex];
      if (scenarioItem.type === 'authentication') {
        currentAuthenticationItem = scenarioItem;
        exec({ scenarioItemResults, scenarioItemIndex: ++scenarioItemIndex });
      } else if (scenarioItem.type === 'path') {
        createTestForScenarioItem({ scenarioItem, currentAuthenticationItem, currentlyExtractedVariables })
        .then((result) => {
          scenarioItemResults.push(result);
          exec({ scenarioItemResults, scenarioItemIndex: ++scenarioItemIndex });
        }).catch((e) => {
          scenarioItem.error = e.message;
          scenarioItemResults.push(scenarioItem);
          exec({ scenarioItemResults, scenarioItemIndex: ++scenarioItemIndex });
        });
      }
    };

    exec();
  });

  scenarioDescription.scenario = await scenarioPromise;
  res.send(JSON.stringify(scenarioDescription));
});

// tslint:disable-next-line:no-console
app.listen(3001, () => console.log('App is running on http://localhost:3001'));

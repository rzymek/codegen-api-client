# Optionated uniform configuration for openapi codegen client

Configure all services generated with openapi codegen fetch-typescript template.

Assumtions:
* Content type is `application/json`
* Authentication is Bearer token via header

## Setup
```
import { Configuration } from "api-client/src";
import * as apis from "api-client/src/apis";

const api = configureApiClient(apis, Configuration, {
  baseUrl: 'http://api.web.app', 
  bearerToken: async () => globalState.bearerToken,
  onErrorResponse(errorJson) {
      if(errorJson.parameterViolations?.length) {
          thro new ApiValidationError();;
      }
  },
  throwError(msg, error) {
      showNotification(msg);
      throw new Error(msg);
  }
  onNetworking(networking) { updateGlobalState({ networking }) }
});
```

## Usage

```
const result = api.SampleResourceApi.list()
```
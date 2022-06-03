[![.github/workflows/publish.yml](https://github.com/rzymek/codegen-api-client/actions/workflows/publish.yml/badge.svg)](https://github.com/rzymek/codegen-api-client/actions/workflows/publish.yml)

# Optionated uniform configuration for openapi codegen client

Configure all services generated with openapi codegen fetch-typescript template.

Assumtions:
* Content type is `application/json`
* Authentication is Bearer token via header

## Install

```bash
yarn install @rzymek/codegen-api-client
```

## Setup
```typescript
import { Configuration } from "api-client/src";
import * as apis from "api-client/src/apis";
import { configureApiClient } from "@rzymek/codegen-api-client";

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

```typescript
const result = api.SampleResourceApi.list()
```

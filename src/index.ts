const isSuccessStatus = (status: number) => 200 <= status && status < 300;

async function getAuthHeaders(config: ApiClientConfiguration): Promise<{}> {
  const { bearerToken = () => Promise.resolve() } = config;
  const token = await bearerToken();
  if (!token) {
    return {};
  }
  return { Authorization: `Bearer ${token}` }
}

async function doFetch(input: RequestInfo, init: RequestInit | undefined, config: ApiClientConfiguration) {
  const {
    throwError = (_, e) => { throw e },
  } = config;
  try {
    return await fetch(input, {
      ...init, headers: {
        ...await getAuthHeaders(config),
        ...init?.headers
      }
    });
  } catch (error) {
    return throwError(error instanceof Error ? error.message : String(error), error)
  }
}

type BaseAPI<Configuration> = new (config?: Configuration) => any;
type ImportedApis<Configuration> = Record<string, BaseAPI<Configuration>>;
type FetchAPI = WindowOrWorkerGlobalScope['fetch'];
interface ConfigurationParameters {
  basePath?: string;
  fetchApi?: FetchAPI;
  headers?: Record<string, string>;
  middleware?: Middleware[]; 
}
interface Middleware {
  onError?(context: ErrorContext): Promise<Response | void>;
}
interface ErrorContext {
  fetch: FetchAPI;
  url: string;
  init: RequestInit;
  error: unknown;
  response?: Response;
}


export interface ApiClientConfiguration {
  baseUrl?: string;
  bearerToken?(): Promise<string|undefined>;
  onErrorResponse?(errorJson: {}): void;
  throwError?(msg: string, error?: unknown): never;
  onNetworking?(active: boolean): void;
}

export function configureApiClient<APIS extends ImportedApis<InstanceType<Configuration>>, Configuration extends new (params: ConfigurationParameters) => any>(
  apis: APIS,
  newConfiguration: Configuration,
  config: ApiClientConfiguration,
): { [key in keyof APIS]: InstanceType<APIS[key]> } {
  const {
    throwError = (msg) => { throw new Error(msg) },
    onErrorResponse = () => { },
    onNetworking = () => { },
  } = config;
  const configuration = new newConfiguration({
    basePath: config.baseUrl ?? '/',
    headers: {
      'Content-Type': 'application/json',
    },
    middleware: [      {
      async onError(context){
        if(context?.error) {
          throw context?.error;
        }
      }
    }],
    fetchApi: async (input: RequestInfo, init?: RequestInit) => {
      onNetworking(true);
      try {
        const response = await doFetch(input, init, config);
        const { status } = response;
        if (!isSuccessStatus(status)) {
          const isJson = response.headers.get('Content-Type') === "application/json"
          if (isJson) {
            const errorJson = await response.json();
            onErrorResponse(errorJson);
            return throwError(`${status}: ${response?.statusText}`, errorJson);
          } else {
            const text = await response.text()
            return throwError(`${status}: ${response?.statusText}:\n${text}`);
          }
        }
        return response;
      } finally {
        onNetworking(false);
      }
    },
  })

  return Object.keys(apis)
    .map((name) => ({ 
      [name]: new apis[name](configuration)
     }))
    .reduce((agg, cur) => ({ ...agg, ...cur }), {}) as { [key in keyof APIS]: InstanceType<APIS[key]> };
}



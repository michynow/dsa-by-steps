import { handleRunRequest } from './handle-run-request';

self.onmessage = (event: MessageEvent) => {
  const result = handleRunRequest(event.data, (response) => {
    self.postMessage(response);
  });
  if (!result.ok) throw new Error(result.error);
};

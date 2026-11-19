import { handleRunRequest } from './handle-run-request';

self.onmessage = (event: MessageEvent) => {
  const response = handleRunRequest(event.data);
  if (!response.ok) throw new Error(response.error);
  self.postMessage(response.value);
};

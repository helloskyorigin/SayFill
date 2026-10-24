'use strict';
// Chrome desktop uses a side panel; Firefox desktop and Firefox Android use
// the manifest's browser action popup. Firefox Android has no sidebar API.
const api = globalThis.browser || globalThis.chrome;
if (api.sidePanel?.setPanelBehavior) {
  const enable = () => api.sidePanel.setPanelBehavior({openPanelOnActionClick: true}).catch(console.warn);
  enable();
  api.runtime.onInstalled.addListener(enable);
}

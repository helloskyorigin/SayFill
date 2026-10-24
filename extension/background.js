// A toolbar click toggles the browser-native sidebar.
'use strict';
const api = globalThis.browser || globalThis.chrome;
if (api.sidePanel?.setPanelBehavior) {
  api.sidePanel.setPanelBehavior({openPanelOnActionClick:true}).catch(console.warn);
  api.runtime.onInstalled.addListener(() => api.sidePanel.setPanelBehavior({openPanelOnActionClick:true}).catch(console.warn));
} else if (api.sidebarAction?.open) {
  api.action.onClicked.addListener(() => {
    api.sidebarAction.open().catch(console.warn);
  });
}

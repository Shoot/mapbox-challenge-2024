/* global chrome */
chrome.tabs.onActivated.addListener(function(activeInfo) {
  chrome.tabs.get(activeInfo.tabId, function(tab) {
    console.log(tab.url);
    // You can do whatever you want with the URL here
  });
});

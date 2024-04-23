/* global chrome */
import React, { useState, useEffect } from 'react';

const TabUrlComponent = () => {
  const [tabUrl, setTabUrl] = useState(null);

  useEffect(() => {
    // Fetch the current tab's URL using chrome.tabs API
    chrome.tabs.query({ active: true, lastFocusedWindow: true }, (tabs) => {
      const currentTab = tabs[0];
      if (currentTab) {
        setTabUrl(currentTab.url);
      }
    });

    // Add listener to update URL when it changes
    const updateTabUrl = (tabId, changeInfo, tab) => {
      if (changeInfo.url && tab.active) {
        setTabUrl(changeInfo.url);
      }
    };
    chrome.tabs.onUpdated.addListener(updateTabUrl);

    return () => {
      // Clean up listeners
      chrome.tabs.onUpdated.removeListener(updateTabUrl);
    };
  }, []);

  return (
    <div>
      {tabUrl ? (
        <p>Current Tab URL: {tabUrl}</p>
      ) : (
        <p>Unable to retrieve current tab URL.</p>
      )}
    </div>
  );
};

export default TabUrlComponent;

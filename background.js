let token = null;
let generalInfo = {};
let activeTabId = null;

// Allowed domains for token capture
const allowedDomains = ["qapita", "qapitacorp"];

const captureToken = (info) => {
  // Ensure token is captured only from the active tab
  if (info.tabId !== activeTabId) return;

  const { requestHeaders, method, url } = info;
  const { host: authority, pathname: path } = new URL(url);

  const isAllowedDomain = allowedDomains.some((domain) =>
    authority.includes(domain)
  );

  if (isAllowedDomain) {
    const authorizationHeader = requestHeaders.find(
      ({ name }) => name.toLowerCase() === "authorization"
    );

    if (authorizationHeader) {
      token = authorizationHeader.value.split(" ")[1]; // Assuming "Bearer <token>"
      console.log(`Token captured: ${token}`);
    }

    generalInfo = {
      method,
      url,
      authority,
      path,
    };

    console.log(
      `General Info: Method - ${method}, URL - ${url}, Authority - ${authority}, Path - ${path}`
    );
  } else {
    console.log(`Skipping URL: ${url} (not an allowed domain)`);
  }
};

// Listener for capturing requests from the active tab
chrome.webRequest.onBeforeSendHeaders.addListener(
  captureToken,
  { urls: ["<all_urls>"] },
  ["requestHeaders"]
);

// Listener for tab switches
chrome.tabs.onActivated.addListener(({ tabId }) => {
  activeTabId = tabId; // Update active tab ID

  chrome.tabs.get(activeTabId, ({ url }) => {
    console.log(`Switched to tab with URL: ${url}`);

    // Reset token and general info when switching tabs
    token = null;
    generalInfo = {};
  });
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "getToken") {
    sendResponse({ token, generalInfo });
  } else {
    sendResponse({ error: "Invalid action" });
  }
  return true;
});

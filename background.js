let token = null;
let generalInfo = {};
let activeTabId = null;
let tabTokenStore = {};

// List of ignored file types (using a regular expression for efficiency)
const ignoredFileTypesRegex =
  /\.(css|js|woff|woff2|ttf|eot|svg|jpg|jpeg|png|gif|bmp|webp|mp3|ogg|wav|aac|flac|mp4|webm|avi|mov|mkv|pdf|doc|docx|ppt|pptx|xls|xlsx|rtf|txt|zip|rar|tar|gz|7z|json|ico)$/;

const captureToken = (info) => {
  // Ensure token is captured only from the active tab
  if (info.tabId !== activeTabId) return;

  const { requestHeaders } = info;

  chrome.tabs.get(activeTabId, (tab) => {
    const { url } = tab;
    const { host: authority } = new URL(url);
    const pathname = new URL(url).pathname;

    // If the request URL matches the current tab's URL
    if (ignoredFileTypesRegex.test(pathname)) {
      console.log(`Skipping request for file type: ${pathname}`);
      return;
    }

    // Capture token if it's not an ignored file type
    const authorizationHeader = requestHeaders.find(
      ({ name }) => name.toLowerCase() === "authorization"
    );

    if (authorizationHeader) {
      token = authorizationHeader.value.split(" ")[1]; // Assuming "Bearer <token>"
      console.log(`Token captured: ${token}`);
    }

    generalInfo = {
      method: info.method,
      url,
      authority,
      path: pathname,
    };

    console.log(
      `General Info: Method - ${info.method}, URL - ${url}, Authority - ${authority}, Path - ${pathname}`
    );

    // Save the token and general info in the cache for this tab
    tabTokenStore[activeTabId] = { token, generalInfo };
  });
};

// Listener for capturing requests from the active tab
chrome.webRequest.onBeforeSendHeaders.addListener(
  captureToken,
  { urls: ["<all_urls>"] },
  ["requestHeaders"]
);

// Listener for tab switches
chrome.tabs.onActivated.addListener(({ tabId }) => {
  activeTabId = tabId;

  chrome.tabs.get(activeTabId, ({ url }) => {
    console.log(`Switched to tab with URL: ${url}`);

    // Restore token and general info from cache if available for the tab
    if (tabTokenStore[tabId]) {
      ({ token, generalInfo } = tabTokenStore[tabId]);
      console.log(`Restored token for tab ${tabId}: ${token}`);
    } else {
      // Reset if no data is cached for this tab
      token = null;
      generalInfo = {};
      console.log(`No token found for tab ${tabId}, resetting.`);
    }
  });
});

// Listener for messages from other parts of the extension
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "getToken") {
    sendResponse({ token, generalInfo });
  } else {
    sendResponse({ error: "Invalid action" });
  }
  return true;
});

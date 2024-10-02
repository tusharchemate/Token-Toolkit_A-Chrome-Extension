// Initialize event listeners for buttons
document
  .getElementById("copyTokenButton")
  .addEventListener("click", () => copyToClipboard("token"));
document
  .getElementById("copyPathButton")
  .addEventListener("click", () => copyToClipboard("path"));
document
  .getElementById("copyDomainButton")
  .addEventListener("click", () => copyToClipboard("domain"));

// Function to copy token, path, or domain to clipboard
const copyToClipboard = (type) => {
  chrome.runtime.sendMessage({ action: "getToken" }, (response) => {
    const statusElement = document.getElementById("status");
    let textToCopy = null;

    if (type === "token") {
      textToCopy = response?.token;
    } else if (type === "path") {
      textToCopy = response?.generalInfo?.path;
    } else if (type === "domain") {
      textToCopy = response?.generalInfo?.authority;
    }

    if (textToCopy) {
      navigator.clipboard
        .writeText(textToCopy)
        .then(() => {
          statusElement.textContent = `${
            type.charAt(0).toUpperCase() + type.slice(1)
          } copied!`;
          statusElement.classList.remove("error");
        })
        .catch((err) => {
          showError(statusElement, `Failed to copy ${type}.`);
          console.error(`Failed to copy ${type}:`, err);
        });
    } else {
      showError(statusElement, `No ${type} found.`);
    }
  });
};

// Function to display error messages
const showError = (statusElement, message) => {
  statusElement.classList.add("error");
  statusElement.textContent = message;
};

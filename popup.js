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
      const expirationMessage = getExpirationInfo(textToCopy);
      statusElement.innerHTML = `Token copied!<br><p>${expirationMessage}</p>`;
      statusElement.classList.remove("error");
    } else if (type === "path") {
      textToCopy = response?.generalInfo?.path;
    } else if (type === "domain") {
      textToCopy = response?.generalInfo?.authority;
    }

    if (textToCopy) {
      navigator.clipboard
        .writeText(textToCopy)
        .then(() => {
          if (type !== "token") {
            statusElement.textContent = `${
              type.charAt(0).toUpperCase() + type.slice(1)
            } copied!`;
            statusElement.classList.remove("error");
          }
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

// Function to decode the JWT token
const decodeJWT = (token) => {
  try {
    const base64Url = token.split(".")[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map(function (c) {
          return "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2);
        })
        .join("")
    );
    return JSON.parse(jsonPayload);
  } catch (e) {
    console.log("Invalid JWT Token");
    return null;
  }
};

// Function to get the expiration info from the JWT token
const getExpirationInfo = (token) => {
  const decodedToken = decodeJWT(token);
  if (decodedToken && decodedToken.exp) {
    const expirationTime = new Date(decodedToken.exp * 1000);
    const currentTime = new Date();
    return `Expires in: ${getRemainingTime(expirationTime, currentTime)}`;
  } else {
    return "Expiration info not available.";
  }
};

// Function to calculate remaining time until expiration
const getRemainingTime = (expirationTime, currentTime) => {
  const timeDiff = expirationTime - currentTime;
  const minutes = Math.floor((timeDiff / 1000 / 60) % 60);
  const hours = Math.floor((timeDiff / 1000 / 60 / 60) % 24);
  const days = Math.floor(timeDiff / 1000 / 60 / 60 / 24);

  if (days > 0) {
    return `${days} days ${hours} hours`;
  } else if (hours > 0) {
    return `${hours} hours ${minutes} minutes`;
  } else if (minutes > 0) {
    return `${minutes} minutes`;
  } else {
    return "Token expired";
  }
};

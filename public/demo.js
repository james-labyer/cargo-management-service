const APP_URL = "http://localhost:8080";
// const APP_URL = "https://cargo-management-service.uc.r.appspot.com";

// from https://www.w3schools.com/js/js_cookies.asp
function getCookie(cname) {
  let name = cname + "=";
  let decodedCookie = decodeURIComponent(document.cookie);
  let ca = decodedCookie.split(";");
  for (let i = 0; i < ca.length; i++) {
    let c = ca[i];
    while (c.charAt(0) == " ") {
      c = c.substring(1);
    }
    if (c.indexOf(name) == 0) {
      return c.substring(name.length, c.length);
    }
  }
  return "";
}

function reportError(resultElem, message) {
  resultElem.innerHTML = message;
  resultElem.classList.add("result-code");
  throw new Error(message);
}

function execFetch(resultElem, apiURL, method, body) {
  if (!token) {
    reportError(resultElem, "Not authorized");
  }
  const bearer = "Bearer " + token;
  let options = {
    headers: {
      Authorization: bearer,
    },
  };

  if (method) {
    options.method = method;
  }

  if (body) {
    options["headers"]["Content-Type"] = "application/json";
    options.body = JSON.stringify(body);
  }

  fetch(apiURL, options)
    .then((response) => {
      if (response.status === 204) {
        return `Response status: ${response.status} No Content`;
      } else {
        return response.json();
      }
    })
    .then((data) => {
      if (typeof data === "string") {
        strData = data;
      } else {
        strData = JSON.stringify(data);
      }
      resultElem.innerHTML = strData;
      resultElem.classList.add("result-code");
    })
    .catch((error) => reportError(resultElem, `FETCH: ${error}`));
}
const token = getCookie("token");

function addABoat() {
  const resultElem = document.getElementById("add-boat-result");
  attrElems = [
    ["name", document.getElementById("add-boat-name")],
    ["type", document.getElementById("add-boat-type")],
    ["length", document.getElementById("add-boat-length")],
  ];
  let body = {};
  for (let i = 0; i < 3; i++) {
    if (!attrElems[i][1].value) {
      reportError(resultElem, "Missing at least one attribute");
    }
    body[attrElems[i][0]] = attrElems[i][1].value;
  }
  const apiURL = `${APP_URL}/boats`;
  execFetch(resultElem, apiURL, "POST", body);
}

function getAllBoats() {
  const resultElem = document.getElementById("get-all-boats-result");
  const apiURL = `${APP_URL}/boats`;
  execFetch(resultElem, apiURL);
}

function getABoat() {
  const resultElem = document.getElementById("get-a-boat-result");
  const formElem = document.getElementById("get-boat-id");
  if (!formElem.value) {
    reportError(resultElem, "Missing Boat ID");
  }
  const apiURL = `${APP_URL}/boats/${formElem.value}`;
  execFetch(resultElem, apiURL);
}

function patchABoat() {
  const resultElem = document.getElementById("patch-a-boat-result");
  const boatIDElem = document.getElementById("patch-boat-id");
  if (!boatIDElem.value) {
    reportError(resultElem, "Missing Boat ID");
  }
  optionalElems = [
    ["name", document.getElementById("patch-boat-name")],
    ["type", document.getElementById("patch-boat-type")],
    ["length", document.getElementById("patch-boat-length")],
  ];
  let body = {};
  for (let i = 0; i < 3; i++) {
    if (optionalElems[i][1].value) {
      body[optionalElems[i][0]] = optionalElems[i][1].value;
    }
  }
  if (Object.keys(body).length === 0) {
    reportError(resultElem, "No attributes provided");
  }
  const apiURL = `${APP_URL}/boats/${boatIDElem.value}`;
  execFetch(resultElem, apiURL, "PATCH", body);
}

function putABoat() {
  const resultElem = document.getElementById("put-a-boat-result");
  const boatIDElem = document.getElementById("put-boat-id");
  if (!boatIDElem.value) {
    reportError(resultElem, "Missing Boat ID");
  }
  attrElems = [
    ["name", document.getElementById("put-boat-name")],
    ["type", document.getElementById("put-boat-type")],
    ["length", document.getElementById("put-boat-length")],
  ];
  let body = {};
  for (let i = 0; i < 3; i++) {
    if (!attrElems[i][1].value) {
      reportError(resultElem, "Missing at least one attribute");
    }
    body[attrElems[i][0]] = attrElems[i][1].value;
  }
  const apiURL = `${APP_URL}/boats/${boatIDElem.value}`;
  execFetch(resultElem, apiURL, "PUT", body);
}

function deleteABoat() {
  const resultElem = document.getElementById("delete-a-boat-result");
  const formElem = document.getElementById("delete-boat-id");
  if (!formElem.value) {
    reportError(resultElem, "Missing Boat ID");
  }
  const apiURL = `${APP_URL}/boats/${formElem.value}`;
  execFetch(resultElem, apiURL, "DELETE");
}

function addACargo() {
  const resultElem = document.getElementById("add-cargo-result");
  attrElems = [
    ["item", document.getElementById("add-cargo-item")],
    ["volume", document.getElementById("add-cargo-volume")],
  ];
  let body = {};
  for (let i = 0; i < 2; i++) {
    if (!attrElems[i][1].value) {
      reportError(resultElem, "Missing at least one attribute");
    }
    body[attrElems[i][0]] = attrElems[i][1].value;
  }
  const apiURL = `${APP_URL}/cargo`;
  execFetch(resultElem, apiURL, "POST", body);
}

function getACargo() {
  const resultElem = document.getElementById("get-a-cargo-result");
  const formElem = document.getElementById("get-cargo-id");
  if (!formElem.value) {
    reportError(resultElem, "Missing Cargo ID");
  }
  const apiURL = `${APP_URL}/cargo/${formElem.value}`;
  execFetch(resultElem, apiURL);
}

function getAllCargo() {
  const resultElem = document.getElementById("get-all-cargo-result");
  const apiURL = `${APP_URL}/cargo`;
  execFetch(resultElem, apiURL);
}

function patchACargo() {
  const resultElem = document.getElementById("patch-a-cargo-result");
  const cargoIDElem = document.getElementById("patch-cargo-id");
  if (!cargoIDElem.value) {
    reportError(resultElem, "Missing Cargo ID");
  }
  optionalElems = [
    ["item", document.getElementById("patch-cargo-item")],
    ["volume", document.getElementById("patch-cargo-volume")],
  ];
  let body = {};
  for (let i = 0; i < 2; i++) {
    if (optionalElems[i][1].value) {
      body[optionalElems[i][0]] = optionalElems[i][1].value;
    }
  }
  if (Object.keys(body).length === 0) {
    reportError(resultElem, "No attributes provided");
  }
  const apiURL = `${APP_URL}/cargo/${cargoIDElem.value}`;
  execFetch(resultElem, apiURL, "PATCH", body);
}

function putACargo() {
  const resultElem = document.getElementById("put-a-cargo-result");
  const cargoIDElem = document.getElementById("put-cargo-id");
  if (!cargoIDElem.value) {
    reportError(resultElem, "Missing Cargo ID");
  }
  attrElems = [
    ["item", document.getElementById("put-cargo-item")],
    ["volume", document.getElementById("put-cargo-volume")],
  ];
  let body = {};
  for (let i = 0; i < 2; i++) {
    if (!attrElems[i][1].value) {
      reportError(resultElem, "Missing at least one attribute");
    }
    body[attrElems[i][0]] = attrElems[i][1].value;
  }
  const apiURL = `${APP_URL}/cargo/${cargoIDElem.value}`;
  execFetch(resultElem, apiURL, "PUT", body);
}

function deleteACargo() {
  const resultElem = document.getElementById("delete-a-cargo-result");
  const formElem = document.getElementById("delete-cargo-id");
  if (!formElem.value) {
    reportError(resultElem, "Missing Cargo ID");
  }
  const apiURL = `${APP_URL}/cargo/${formElem.value}`;
  execFetch(resultElem, apiURL, "DELETE");
}

function assignCargotoBoat() {
  const resultElem = document.getElementById("assign-cargo-result");
  const cargoElem = document.getElementById("assign-cargo-id");
  const boatElem = document.getElementById("assign-boat-id");
  if (!boatElem.value || !cargoElem.value) {
    reportError(resultElem, "Missing Boat ID or Cargo ID");
  }
  const apiURL = `${APP_URL}/boats/${boatElem.value}/cargo/${cargoElem.value}`;
  execFetch(resultElem, apiURL, "PUT");
}

function removeCargofromBoat() {
  const resultElem = document.getElementById("remove-cargo-result");
  const cargoElem = document.getElementById("remove-cargo-id");
  const boatElem = document.getElementById("remove-boat-id");
  if (!boatElem.value || !cargoElem.value) {
    reportError(resultElem, "Missing Boat ID or Cargo ID");
  }
  const apiURL = `${APP_URL}/boats/${boatElem.value}/cargo/${cargoElem.value}`;
  execFetch(resultElem, apiURL, "DELETE");
}

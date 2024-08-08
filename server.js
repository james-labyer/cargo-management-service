const express = require("express");
const serveStatic = require("serve-static");
const { expressjwt: jwt } = require("express-jwt");
const jwksRsa = require("jwks-rsa");
const { auth, requiresAuth } = require("express-openid-connect");
const path = require("path");
const {
  userLogin,
  getAllUsers,
  createBoat,
  getBoatsAuth,
  getBoat,
  updateBoat,
  deleteBoat,
  getAllCargo,
  createCargo,
  getCargo,
  updateCargo,
  deleteCargo,
  assignCargotoBoat,
  deleteCargotoBoatMapping,
} = require("./model");

const config = {
  authRequired: false,
  auth0Logout: true,
  baseURL: `${process.env.APP_URL}`,
  clientID: process.env.CLIENT_ID,
  issuerBaseURL: `https://${process.env.AUTH0_DOMAIN}`,
  secret: process.env.CLIENT_SECRET,
};

const app = express();

// app.use("ship-solid.svg", express.static("public/ship-solid.svg"));
// app.use(express.static(path.join(__dirname, "public")));
app.use(
  // serveStatic(path.join(__dirname, "public"), { index: ["welcome.html"] })
  serveStatic(path.join(__dirname, "public"))
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(auth(config));

/* ------------- Middleware Functions ------------- */

const checkJwt = jwt({
  secret: jwksRsa.expressJwtSecret({
    cache: true,
    rateLimit: true,
    jwksRequestsPerMinute: 5,
    jwksUri: `https://${process.env.AUTH0_DOMAIN}/.well-known/jwks.json`,
  }),

  // Validate the audience and the issuer.
  issuer: `https://${process.env.AUTH0_DOMAIN}/`,
  algorithms: ["RS256"],
  credentialsRequired: false,
});

/* ------------- ROUTES ------------- */

/* ------------- pages -------------- */

app.get("/", (req, res) => {
  if (req.oidc.isAuthenticated()) {
    if (!req.accepts("application/json")) {
      res.status(406).send({ Error: "server can only send application/json" });
      return;
    } else {
      const userData = {
        sub: req.oidc.user.sub,
        name: req.oidc.user.name,
        updated_at: req.oidc.user.updated_at,
      };
      userLogin(userData)
        .then((user_id) => {
          /* const userObj = { token: req.oidc.idToken, user_id: user_id };
          res.json(userObj); */
          const options = { root: path.join(__dirname) };
          res.sendFile("public/main.html", options);
        })
        .catch((err) => {
          console.error(err);
          res.status(500).send(err);
        });
    }
  } else {
    const options = { root: path.join(__dirname) };
    res.sendFile("public/index.html", options);
  }
  // const options = { root: path.join(__dirname) };
  // res.set("Content-Type", "text/css");
  // res.sendFile("public/main.html", options);
});

app.get("/profile", requiresAuth(), (req, res) => {
  if (!req.accepts("application/json")) {
    res.status(406).send({ Error: "server can only send application/json" });
  } else {
    res.json(req.oidc.user);
  }
});

app.get("/callback", (req, res) => {
  console.log("callback");
});

app.get("/main.html", (req, res) => {
  if (req.oidc.isAuthenticated()) {
    const options = { root: path.join(__dirname) };
    res.sendFile("public/main.html", options);
  } else {
    const options = { root: path.join(__dirname) };
    res.sendFile("public/index.html", options);
  }
});

/* ------------- /users ------------- */

app.get("/users", (req, res) => {
  if (!req.accepts("application/json")) {
    res.status(406).send({ Error: "server can only send application/json" });
  } else {
    getAllUsers()
      .then((result) => {
        res.status(result[0]).json(result[1]);
      })
      .catch((err) => {
        console.error(err);
        res.status(500).send(err);
      });
  }
});

app.post("/users", (req, res) => {
  res.set("Accept", "GET");
  res.status(405).send();
});

app.put("/users", (req, res) => {
  res.set("Accept", "GET");
  res.status(405).send();
});

app.patch("/users", (req, res) => {
  res.set("Accept", "GET");
  res.status(405).send();
});

app.delete("/users", (req, res) => {
  res.set("Accept", "GET");
  res.status(405).send();
});

/* ------------- /boats ------------- */

app.get("/boats", checkJwt, (req, res) => {
  if (!req.auth) {
    res.status(401).send({ Error: "not authorized" });
  } else if (!req.accepts("application/json")) {
    res.status(406).send({ Error: "server can only send application/json" });
    return;
  } else {
    let cursor = "";
    if (Object.keys(req.query).includes("cursor")) {
      cursor = req.query.cursor;
    }
    getBoatsAuth(req.auth.sub, cursor)
      .then((result) => {
        res.status(result[0]).json(result[1]);
      })
      .catch((err) => {
        console.error(err);
        res.status(500).send(err);
      });
  }
});

app.post("/boats", checkJwt, (req, res) => {
  if (!req.auth) {
    res.status(401).send({ Error: "not authorized" });
  } else if (!req.accepts("application/json")) {
    res.status(406).send({ Error: "server can only send application/json" });
  } else if (!req.body.name || !req.body.type || !req.body.length) {
    res.status(400).json({
      Error:
        "The request object is missing at least one of the required attributes",
    });
  } else if (Object.keys(req.body).length > 3) {
    res.status(400).json({
      Error: "The request object must have exactly three attributes",
    });
  } else {
    const boatData = JSON.parse(JSON.stringify(req.body));
    boatData.owner = req.auth.sub;
    createBoat(boatData)
      .then((result) => {
        // result will be of the form [status, response_obj]
        res.status(result[0]).json(result[1]);
      })
      .catch((err) => console.error(err));
  }
});

app.put("/boats", (req, res) => {
  res.set("Accept", "GET, POST");
  res.status(405).send();
});

app.patch("/boats", (req, res) => {
  res.set("Accept", "GET, POST");
  res.status(405).send();
});

app.delete("/boats", (req, res) => {
  res.set("Accept", "GET, POST");
  res.status(405).send();
});

app.get("/boats/:boat_id", checkJwt, (req, res) => {
  if (!req.auth) {
    res.status(401).send({ Error: "not authorized" });
  } else if (!req.accepts("application/json")) {
    res.status(406).send({ Error: "server can only send application/json" });
  } else {
    idInt = parseInt(req.params.boat_id);
    getBoat(idInt, req.auth.sub)
      .then((result) => {
        // result will be of the form [status, response_obj]
        res.status(result[0]).json(result[1]);
      })
      .catch((err) => console.error(err));
  }
});

app.patch("/boats/:boat_id", checkJwt, (req, res) => {
  if (!req.auth) {
    res.status(401).send({ Error: "not authorized" });
  } else if (!req.accepts("application/json")) {
    res.status(406).send({ Error: "server can only send application/json" });
  } else {
    const bodyKeys = Object.keys(req.body);
    if (bodyKeys.length <= 0) {
      res.status(400).json({
        Error: "The request object must have at least one attribute",
      });
    }
    const validKeys = ["name", "type", "length"];
    for (key in bodyKeys) {
      if (!validKeys.includes(bodyKeys[key])) {
        res.status(400).json({
          Error: "Invalid attribute in request body",
        });
      }
    }
    updateBoat(parseInt(req.params.boat_id), req.body, req.auth.sub)
      .then((result) => {
        res.status(result[0]).json(result[1]);
      })
      .catch((err) => console.error(err));
  }
});

app.put("/boats/:boat_id", checkJwt, (req, res) => {
  if (!req.auth) {
    res.status(401).send({ Error: "not authorized" });
  } else if (!req.accepts("application/json")) {
    res.status(406).send({ Error: "server can only send application/json" });
  } else if (!req.body.name || !req.body.type || !req.body.length) {
    res.status(400).json({
      Error:
        "The request object is missing at least one of the required attributes",
    });
  } else if (Object.keys(req.body).length > 3) {
    res.status(400).json({
      Error: "The request object has too many attributes",
    });
  } else {
    updateBoat(parseInt(req.params.boat_id), req.body, req.auth.sub)
      .then((result) => {
        res.status(result[0]).json(result[1]);
      })
      .catch((err) => console.error(err));
  }
});

app.delete("/boats/:boat_id", checkJwt, (req, res) => {
  if (!req.auth) {
    res.status(401).send({ Error: "not authorized" });
  } else {
    deleteBoat(parseInt(req.params.boat_id), req.auth.sub)
      .then((result) => {
        res.status(result[0]).json(result[1]);
      })
      .catch((err) => {
        console.error(err);
      });
  }
});

/* ------------- /cargo ------------- */

app.get("/cargo", (req, res) => {
  if (!req.accepts("application/json")) {
    res.status(406).send({ Error: "server can only send application/json" });
    return;
  } else {
    let cursor = "";
    if (Object.keys(req.query).includes("cursor")) {
      cursor = req.query.cursor;
    }
    getAllCargo(cursor)
      .then((result) => {
        res.status(result[0]).json(result[1]);
      })
      .catch((err) => {
        console.error(err);
        res.status(500).send(err);
      });
  }
});

app.post("/cargo", (req, res) => {
  if (!req.accepts("application/json")) {
    res.status(406).send({ Error: "server can only send application/json" });
  } else if (!req.body.item || !req.body.volume) {
    res.status(400).json({
      Error:
        "The request object is missing at least one of the required attributes",
    });
  } else if (Object.keys(req.body).length > 2) {
    res.status(400).json({
      Error: "The request object must have exactly two attributes",
    });
  } else {
    createCargo(req.body)
      .then((result) => {
        // result will be of the form [status, response_obj]
        res.status(result[0]).json(result[1]);
      })
      .catch((err) => console.error(err));
  }
});

app.put("/cargo", (req, res) => {
  res.set("Accept", "GET, POST");
  res.status(405).send();
});

app.patch("/cargo", (req, res) => {
  res.set("Accept", "GET, POST");
  res.status(405).send();
});

app.delete("/cargo", (req, res) => {
  res.set("Accept", "GET, POST");
  res.status(405).send();
});

app.get("/cargo/:cargo_id", (req, res) => {
  if (!req.accepts("application/json")) {
    res.status(406).send({ Error: "server can only send application/json" });
    return;
  } else {
    getCargo(parseInt(req.params.cargo_id))
      .then((result) => {
        res.status(result[0]).json(result[1]);
      })
      .catch((err) => {
        console.error(err);
        res.status(500).send(err);
      });
  }
});

app.patch("/cargo/:cargo_id", (req, res) => {
  if (!req.accepts("application/json")) {
    res.status(406).send({ Error: "server can only send application/json" });
  } else {
    const bodyKeys = Object.keys(req.body);
    if (bodyKeys.length <= 0) {
      res.status(400).json({
        Error: "The request object must have at least one attribute",
      });
    }
    const validKeys = ["item", "volume"];
    for (key in bodyKeys) {
      if (!validKeys.includes(bodyKeys[key])) {
        res.status(400).json({
          Error: "Invalid attribute in request body",
        });
      }
    }
    updateCargo(parseInt(req.params.cargo_id), req.body)
      .then((result) => {
        res.status(result[0]).json(result[1]);
      })
      .catch((err) => console.error(err));
  }
});

app.put("/cargo/:cargo_id", (req, res) => {
  if (!req.accepts("application/json")) {
    res.status(406).send({ Error: "server can only send application/json" });
  } else if (!req.body.item || !req.body.volume) {
    res.status(400).json({
      Error:
        "The request object is missing at least one of the required attributes",
    });
  } else if (Object.keys(req.body).length > 2) {
    res.status(400).json({
      Error: "The request object has too many attributes",
    });
  } else {
    updateCargo(parseInt(req.params.cargo_id), req.body)
      .then((result) => {
        res.status(result[0]).json(result[1]);
      })
      .catch((err) => console.error(err));
  }
});

app.delete("/cargo/:cargo_id", (req, res) => {
  deleteCargo(parseInt(req.params.cargo_id))
    .then((result) => {
      res.status(result[0]).json(result[1]);
    })
    .catch((err) => {
      console.error(err);
    });
});

/* ------------- /boats/:boat_id/cargo/:cargo_id ------------- */

app.put("/boats/:boat_id/cargo/:cargo_id", (req, res) => {
  assignCargotoBoat(parseInt(req.params.boat_id), parseInt(req.params.cargo_id))
    .then((result) => {
      res.status(result[0]).json(result[1]);
    })
    .catch((err) => {
      console.error(err);
    });
});

app.delete("/boats/:boat_id/cargo/:cargo_id", (req, res) => {
  deleteCargotoBoatMapping(
    parseInt(req.params.boat_id),
    parseInt(req.params.cargo_id)
  )
    .then((result) => {
      res.status(result[0]).json(result[1]);
    })
    .catch((err) => {
      console.error(err);
    });
});

/* ------------- Start app ------------- */

// Listen to the App Engine-specified port, or 8080 otherwise
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}...`);
});

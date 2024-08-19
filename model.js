const { Datastore } = require("@google-cloud/datastore");
require("dotenv").config();
const { User, Boat, Cargo } = require("./classes");

const BOAT_PROP_SIZE = 87375;
PAGE_SIZE = 5;

const datastore = new Datastore();

/*---- Helper functions ----*/

function validateStrProp(strProp) {
  if (typeof strProp !== "string") {
    return [400, { Error: "Property type must be string" }];
  }
  // validate input: length restriction
  if (strProp.length > BOAT_PROP_SIZE) {
    return [400, { Error: "One or more properties is too long" }];
  }
  return [0];
}

function validateNumProp(numProp) {
  const lengthInt = parseInt(numProp, 10);
  if (isNaN(lengthInt)) {
    return [400, { Error: "Length must be a number" }];
  } else {
    return [0];
  }
}

/*---- Functions called from server.js ----*/

async function userLogin(userData) {
  // userData has: sub, name, updated_at
  const newUser = new User();
  query = datastore.createQuery("User").filter("sub", "=", userData.sub);
  const users = await datastore.runQuery(query);
  if (users[0].length == 1) {
    newUser.setKeyManual(users[0][0][datastore.KEY]);
    // update name and updated_at
    newUser.setData({
      name: userData.name,
      sub: users[0][0].sub,
      boats: users[0][0].boats,
      created_at: users[0][0].created_at,
      updated_at: userData.updated_at,
    });
    await newUser.updateDB();
    return users[0][0][datastore.KEY].id;
  } else if (users[0].length == 0) {
    newUser.setKey();
    newUser.setData({
      name: userData.name,
      sub: userData.sub,
      boats: [],
      created_at: userData.updated_at,
      updated_at: userData.updated_at,
    });
    await newUser.addToDB();
    return newUser.key.id;
  } else {
    return undefined;
  }
}

async function getAllUsers() {
  const query = datastore.createQuery("User");
  const [users] = await datastore.runQuery(query);
  const niceUsers = [];
  for (idx in users) {
    const userObj = {
      id: parseInt(users[idx][datastore.KEY].id),
      name: users[idx].name,
      sub: users[idx].sub,
      boats: users[idx].boats,
      created_at: users[idx].created_at,
      updated_at: users[idx].updated_at,
    };
    niceUsers.push(userObj);
  }
  return [200, niceUsers];
}

async function createBoat(boatData) {
  try {
    // create Boat object
    const newBoat = new Boat(boatData);
    newBoat.setKey();
    await newBoat.addToDB();
    return [201, newBoat.getResponse()];
  } catch (err) {
    console.error(err);
  }
}

async function getBoatsAuth(ownerID, cursor) {
  let query = datastore
    .createQuery("Boat")
    .filter("owner", "=", ownerID)
    .limit(PAGE_SIZE);
  if (cursor !== "") {
    query = query.start(cursor);
  }
  const boats = await datastore.runQuery(query);
  const results = {};
  results.items = [];
  for (idx in boats[0]) {
    const boatObj = {
      id: parseInt(boats[0][idx][datastore.KEY].id),
      name: boats[0][idx].name,
      type: boats[0][idx].type,
      length: boats[0][idx].length,
      owner: boats[0][idx].owner,
      self: `${process.env.APP_URL}/boats/${boats[0][idx][datastore.KEY].id}`,
    };
    results.items.push(boatObj);
  }
  if (boats[1].moreResults !== Datastore.NO_MORE_RESULTS) {
    results.next = process.env.APP_URL + "/boats?cursor=" + boats[1].endCursor;
  }
  const countQuery = datastore
    .createQuery("Boat")
    .filter("owner", "=", ownerID);
  const [totalBoats] = await datastore.runQuery(countQuery);
  results.total = totalBoats.length;
  return [200, results];
}

async function getBoat(boatID, userSub) {
  try {
    // find out if boat exists
    const thisBoat = new Boat({});
    const queryStatus = await thisBoat.populateFromDB(boatID);
    if (!queryStatus) {
      return [404, { Error: "No boat with this boat_id exists" }];
    } else if (thisBoat.getOwner() !== userSub) {
      return [403, { Error: "Boat can only be accessed by its owner" }];
    } else {
      const boatJSON = thisBoat.getResponse();
      return [200, boatJSON];
    }
  } catch (err) {
    console.error(err);
    return [500, { Error: err }];
  }
}

async function updateBoat(boat_id, boatData, userSub) {
  try {
    const thisBoat = new Boat({});
    const queryStatus = await thisBoat.populateFromDB(boat_id);
    if (!queryStatus) {
      return [404, { Error: "No boat with this boat_id exists" }];
    } else if (thisBoat.getOwner() !== userSub) {
      return [403, { Error: "Boat can only be modified by its owner" }];
    }
    // if a property has been provided, and has a new value, it must be validated
    // before updating the object
    const props = {
      length: ["getLength", validateNumProp, "setLength"],
      type: ["getType", validateStrProp, "setType"],
      name: ["getName", validateStrProp, "setName"],
    };
    for (const prop in props) {
      if (boatData[prop] && boatData[prop] !== thisBoat[props[prop][0]]()) {
        const validity = props[prop][1](boatData[prop]);
        if (validity[0] !== 0) {
          return validity;
        } else {
          if (prop === "length") {
            thisBoat[props[prop][2]](parseInt(boatData[prop]));
          } else {
            thisBoat[props[prop][2]](boatData[prop]);
          }
        }
      }
    }
    await thisBoat.updateDB();
    return [200, thisBoat.getResponse()];
  } catch (err) {
    console.error(err);
  }
}

async function deleteBoat(boatID, requester) {
  try {
    // find out if boat exists
    const thisBoat = new Boat({});
    const queryStatus = await thisBoat.populateFromDB(boatID);
    if (!queryStatus) {
      return [404, { Error: "No boat with this boat_id exists" }];
    } else {
      // make sure the boat belongs to the user requesting the delete
      if (thisBoat.getOwner() !== requester) {
        return [403, { Error: "Boat can only be deleted by its owner" }];
      }
      // update carriers of cargo on boat
      const boatCargo = thisBoat.getCargoList();
      for (let cargo in boatCargo) {
        const currCargo = new Cargo({});
        const cargoStatus = await currCargo.populateFromDB(boatCargo[cargo].id);
        if (!cargoStatus) {
          return [500, { Error: "Invalid cargo_id" }];
        }
        currCargo.setCarrier(null);
        await currCargo.updateDB();
      }
      // delete boat
      await datastore.delete(thisBoat.key);
      return [204, {}];
    }
  } catch (err) {
    console.error(err);
    return undefined;
  }
}

async function getAllCargo(cursor) {
  let query = datastore.createQuery("Cargo").limit(PAGE_SIZE);
  if (cursor !== "") {
    query = query.start(cursor);
  }
  const cargo = await datastore.runQuery(query);
  const results = {};
  results.items = [];
  for (idx in cargo[0]) {
    const cargoObj = {
      id: parseInt(cargo[0][idx][datastore.KEY].id),
      item: cargo[0][idx].item,
      volume: cargo[0][idx].volume,
      carrier: cargo[0][idx].carrier,
      carrier: cargo[0][idx].carrier,
      self: `${process.env.APP_URL}/cargo/${cargo[0][idx][datastore.KEY].id}`,
    };
    results.items.push(cargoObj);
  }
  if (cargo[1].moreResults !== Datastore.NO_MORE_RESULTS) {
    results.next = `${process.env.APP_URL}/cargo?cursor=${cargo[1].endCursor}`;
  }
  const countQuery = datastore.createQuery("Cargo");
  const [totalCargo] = await datastore.runQuery(countQuery);
  results.total = totalCargo.length;
  return [200, results];
}

async function createCargo(cargoData) {
  try {
    const newCargo = new Cargo(cargoData);
    newCargo.setKey();
    await newCargo.addToDB();
    return [201, newCargo.getResponse()];
  } catch (err) {
    console.error(err);
  }
}

async function getCargo(cargoID) {
  try {
    // find out if boat exists
    const thisCargo = new Cargo({});
    const queryStatus = await thisCargo.populateFromDB(cargoID);
    if (!queryStatus) {
      return [404, { Error: "No cargo with this cargo_id exists" }];
    } else {
      const cargoJSON = thisCargo.getResponse();
      return [200, cargoJSON];
    }
  } catch (err) {
    console.error(err);
    return [500, { Error: err }];
  }
}

async function updateCargo(cargo_id, cargoData) {
  try {
    const thisCargo = new Cargo({});
    const queryStatus = await thisCargo.populateFromDB(cargo_id);
    if (!queryStatus) {
      return [404, { Error: "No cargo with this cargo_id exists" }];
    }
    // if a property has been provided, and has a new value, it must be validated
    // before updating the object
    const props = {
      item: ["getItem", validateStrProp, "setItem"],
      volume: ["getVolume", validateNumProp, "setVolume"],
    };
    for (const prop in props) {
      if (cargoData[prop] && cargoData[prop] !== thisCargo[props[prop][0]]()) {
        const validity = props[prop][1](cargoData[prop]);
        if (validity[0] !== 0) {
          return validity;
        } else {
          if (prop === "length") {
            thisCargo[props[prop][2]](parseInt(cargoData[prop]));
          } else {
            thisCargo[props[prop][2]](cargoData[prop]);
          }
        }
      }
    }
    await thisCargo.updateDB();
    return [200, thisCargo.getResponse()];
  } catch (err) {
    console.error(err);
  }
}

async function deleteCargo(cargoID) {
  try {
    // find out if boat exists
    const thisCargo = new Cargo({});
    const queryStatus = await thisCargo.populateFromDB(cargoID);
    if (!queryStatus) {
      return [404, { Error: "No cargo with this cargo_id exists" }];
    } else {
      // find out if the cargo has a carrier
      const cargoCarrier = thisCargo.getCarrier();
      if (cargoCarrier !== null) {
        // If so, remove cargo from that Boat
        carrierObj = new Boat({});
        const carrierStatus = await carrierObj.populateFromDB(
          parseInt(cargoCarrier.id)
        );
        if (!carrierStatus) {
          return [500, { Error: "cargo has invalid carrier" }];
        }
        const delStatus = carrierObj.deleteCargo(cargoID);
        if (delStatus) {
          await carrierObj.updateDB();
        } else {
          return [404, { Error: "cargo not on boat" }];
        }
      }
      await datastore.delete(thisCargo.key);
      return [204, {}];
    }
  } catch (err) {
    console.error(err);
    return [500, { Error: err }];
  }
}

async function assignCargotoBoat(boat_id, cargo_id) {
  const thisCargo = new Cargo({});
  const cargoStatus = await thisCargo.populateFromDB(cargo_id);
  // check if Cargo exists
  if (!cargoStatus) {
    return [404, { Error: "The specified cargo does not exist" }];
  }

  // check if Cargo is available for assignment
  if (thisCargo.getCarrier() !== null) {
    return [403, { Error: "The cargo is already assigned to another boat" }];
  }

  // check if Boat exists
  const thisBoat = new Boat({});
  const boatStatus = await thisBoat.populateFromDB(boat_id);
  if (!boatStatus) {
    return [404, { Error: "The specified boat does not exist" }];
  }

  // if pre-conditions are true, update Boat and Cargo objects
  thisBoat.addCargo(thisCargo);
  thisCargo.addCarrier(thisBoat);
  // update DB
  await thisBoat.updateDB();
  await thisCargo.updateDB();
  return [204, {}];
}

async function deleteCargotoBoatMapping(boat_id, cargo_id) {
  // check if Cargo exists
  const thisCargo = new Cargo({});
  await thisCargo.populateFromDB(cargo_id);
  if (thisCargo === undefined || thisCargo === null) {
    return [404, { Error: "The specified cargo does not exist" }];
  }
  // check if Boat exists
  const thisBoat = new Boat({});
  await thisBoat.populateFromDB(boat_id);
  if (thisBoat === undefined || thisBoat === null) {
    return [404, { Error: "The specified boat does not exist" }];
  }
  // check if this Cargo is actually assigned to this Boat
  const cargoCarrier = thisCargo.getCarrier();
  if (cargoCarrier === null || cargoCarrier.id !== boat_id) {
    return [404, { Error: "This cargo is not assigned to this boat" }];
  }
  // if yes, update Boat and Cargo objects
  const delStatus = thisBoat.deleteCargo(cargo_id);
  if (delStatus === undefined) {
    return [500, { Error: "Failed to delete cargo from boat" }];
  } else {
    thisCargo.setCarrier(null);
    await thisCargo.updateDB();
    await thisBoat.updateDB();
    return [204, {}];
  }
}

module.exports = {
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
};

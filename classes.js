const { Datastore } = require("@google-cloud/datastore");

const datastore = new Datastore();

/* ------------- User class ------------- */

class User {
  constructor(userData) {
    this.data = userData;
  }
  setKey() {
    this.key = datastore.key("User");
  }
  setKeyManual(keyObj) {
    this.key = keyObj;
  }
  setName(name) {
    this.data.name = name;
  }
  setUpdatedAt(date) {
    this.data.updated_at = date;
  }
  setData(userData) {
    this.data = userData;
  }
  async addToDB() {
    await datastore.save(this);
  }
  async updateDB() {
    await datastore.update(this);
  }
  getResponse() {
    const user = JSON.parse(JSON.stringify(this.data));
    user.id = this.key.id;
    return user;
  }
}

/* ------------- Boat class ------------- */

class Boat {
  constructor(boatData) {
    this.data = boatData;
    this.data.cargo = [];
  }
  setKey() {
    this.key = datastore.key("Boat");
  }
  setName(newName) {
    this.data.name = newName;
  }
  setType(newType) {
    this.data.type = newType;
  }
  setLength(newLength) {
    this.data.length = newLength;
  }
  addCargo(cargoObj) {
    const cargo = {
      id: parseInt(cargoObj.key.id),
      self: `${process.env.APP_URL}/cargo/${cargoObj.key.id}`,
    };
    this.data.cargo.push(cargo);
  }
  deleteCargo(cargo_id) {
    for (let cargo in this.data.cargo) {
      if (this.data.cargo[cargo].id === cargo_id) {
        this.data.cargo.splice(cargo, 1);
        return true;
      }
    }
    return false;
  }
  async addToDB() {
    await datastore.save(this);
  }
  async updateDB() {
    await datastore.update(this);
  }
  async populateFromDB(boat_id) {
    const key = datastore.key(["Boat", boat_id]);
    const results = await datastore.get(key);
    if (results[0] === undefined) {
      return false;
    } else {
      this.key = key;
      this.data.name = results[0].name;
      this.data.type = results[0].type;
      this.data.length = results[0].length;
      this.data.owner = results[0].owner;
      this.data.cargo = results[0].cargo;
      return true;
    }
  }
  getName() {
    return this.data.name;
  }
  getType() {
    return this.data.type;
  }
  getLength() {
    return this.data.length;
  }
  getOwner() {
    return this.data.owner;
  }
  getCargoList() {
    return this.data.cargo;
  }
  getData() {
    return this.data;
  }
  getResponse() {
    const boat = JSON.parse(JSON.stringify(this.data));
    boat.id = parseInt(this.key.id);
    boat.self = `${process.env.APP_URL}/boats/${this.key.id}`;
    return boat;
  }
}

/* ------------- Cargo class ------------- */

class Cargo {
  constructor(cargoData) {
    this.data = cargoData;
    this.data.carrier = null;
    const sinceEpoch = Date.now();
    const today = new Date(sinceEpoch);
    this.data.created_at = today.toISOString();
  }
  setKey() {
    this.key = datastore.key("Cargo");
  }
  setItem(newItem) {
    this.data.item = newItem;
  }
  setVolume(newVolume) {
    this.data.volume = newVolume;
  }
  setCarrier(carrierObj) {
    this.data.carrier = carrierObj;
  }
  addCarrier(boatObj) {
    try {
      // expects a Boat object
      this.data.carrier = {
        id: parseInt(boatObj.key.id),
        name: boatObj.data.name,
        self: `${process.env.APP_URL}/boats/${boatObj.key.id}`,
      };
      return true;
    } catch (err) {
      console.error(err);
      return false;
    }
  }
  async addToDB() {
    await datastore.save(this);
  }
  async updateDB() {
    await datastore.update(this);
  }
  async populateFromDB(cargo_id) {
    const key = datastore.key(["Cargo", cargo_id]);
    const results = await datastore.get(key);
    if (results[0] === undefined) {
      return false;
    } else {
      this.key = key;
      this.data.item = results[0].item;
      this.data.volume = results[0].volume;
      this.data.carrier = results[0].carrier;
      this.data.created_at = results[0].created_at;
      return true;
    }
  }
  getData() {
    return this.data;
  }
  getItem() {
    return this.data.item;
  }
  getVolume() {
    return this.data.volume;
  }
  getCarrier() {
    return this.data.carrier;
  }
  getResponse() {
    const cargo = JSON.parse(JSON.stringify(this.data));
    cargo.id = parseInt(this.key.id);
    cargo.self = `${process.env.APP_URL}/cargo/${this.key.id}`;
    return cargo;
  }
}

module.exports = {
  User,
  Boat,
  Cargo,
};

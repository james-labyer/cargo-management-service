# Cargo Management Service

## Project Overview

This project models the relationships between boats and their cargo using a non-relational database (Google Datastore). It also enables the creation, retrieval, update, and deletion of boats and cargo via a RESTful API, which is implemented in Node.js. All API endpoints are authenticated using Auth0.

## Setup

To run this environment locally, you will need the Client ID, Secret, and URL for an Auth0 tenant. Save this information in a .env file in the project root folder. The .env file must have valid values for the following fields in order for the app to work:

```
CLIENT_ID=''
CLIENT_SECRET=''
AUTH0_DOMAIN=''
APP_URL= ''
```

To run the project tests, import the Postman collection and environment (located in the "tests" folder) into Postman. Then, in the Postman environment, update the `client_id`, `client_secret`, and `auth0_url` variables with the relevant details.

## Documentation

The API behavior is documented by the Postman tests located in the tests folder.

## How to access app

This app is hosted at https://cargo-management-service.uc.r.appspot.com/

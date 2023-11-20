# API Documentation

This project contains source code and supporting files for the Node.js application that I created. You can check it out on Github here:


This project includes the following files and folders:

- `config/config.js` - Sequelize database connection configurations

- `migrations/` - Sequelize migration files.

- `seeders/` - Sequelize seed files

- `sqlprocedures/` - Contains MYSQL queries for setting up SQL procedures used by the application

- `models/` - Sequelize db models.

- `src/app.js` - Exports the express app itself.

- `src/utils` - Contains helper classes and modules such as sending emails, password hashing, JWT processor, and other utility functions.

- `src/routes` - Route module used by express to serve endpoints.

- `src/middleware` - Contains authentication and validation express middlewares.

- `src/controllers` - Contains the controller logic for the route endpoints.

- `src/database` - Contains the database logic code.

- `src/schemas` - Contains predefined classes for managing and creating new instances of each sequelize model.

- `swagger.json` - Contains OpenAPI api documentation.

## About the application

The application is an express RESTful API. 

Requirements:

* Node.js - [Install Node.js 16.x](https://nodejs.org/en/).
* NPM - Node package management tool (comes with Node.js by default)
* MYSQL WORKBENCH/TablePlus/XAMPP (or any local MySQL server you can find) - [Install XAMPP](https://www.apachefriends.org/download.html), including the npm package management tool.
* PM2 - PM2 is a daemon process manager that will help you manage and keep your application online 24/7. [Learn more](https://pm2.keymetrics.io/)

## Running the application
### Express server
* Start the Express server by running `npm run dev` in your terminal to launch in development mode or `npm start` to run the app server in production mode.

## Testing
Configurations:
1. Create a MYSQL database and provide the connection string as defined in the 'env.example' file

1. Setup your MySQL tables by running the following command on the command line. This would create the test database and execute the sequelize migrations and seed files located in the `migrations/` and `seeders/` folders respectively.

```bash
my-application$ npm run pre-test
```

3. Setup your MySQL procedures by running the query contained in each file in the `sqlprocedures/` folder. You can copy the query to your favourite SQL editor and run it there.

4. Finally, start the test by running the following command on the command line.

```bash
my-application$ npm run test
```

const MongoClient = require('mongodb').MongoClient;
const MONGO_URL = "mongodb://01painadam:Aj6owp!1@ds143744.mlab.com:43744/test_cli_db";

module.exports = function (app) {
    MongoClient.connect(MONGO_URL)
        .then((connection) => {
            app.tasks = connection.collection("tasks");
            console.log("Database connection established")
        })
        .catch((err) => console.error(err))

};
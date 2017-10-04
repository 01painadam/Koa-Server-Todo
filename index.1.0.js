const Koa = require('koa');
const Router = require('koa-router');
const BodyParser = require("koa-bodyparser");
const logger = require('koa-logger');

const app = new Koa();
const router = new Router;
const ObjectID = require("mongodb").ObjectID;

require("./mongo")(app);

let testObj1 = {"id": "-1", "task": "TEST PLZ IGNORE", "done": "false"}
let testObj2 = {"id": "-2", "task": "ANOTHER TEST", "done": "false"}

let testArray = [testObj1, testObj2]

// Use the bodyparser & logger middlware
app.use(BodyParser());
app.use(logger());


//to local host method
router.get("/", async function (ctx) {
    //let name = ctx.request.query.task || "World";
    ctx.body = testArray;     //show whatever using cxt.body assignment

});

// List all tasks in mongo db localhost using: http://localhost:5000/tasks
router.get("/tasks", async (ctx) => {
    ctx.body = await ctx.app.tasks.find().toArray();
});

// manual post 
router.post("/", async function (ctx) {
    let name = ctx.request.body.task || "World";
    ctx.body = {message: `Hello ${task}!`}
});

// POST new task
router.post("/tasks", async (ctx) => {
    ctx.body = await ctx.app.tasks.insert(ctx.request.body);
});

//POST COMMAND LINE USEAGE
/*

curl -X POST \
http://localhost:5000/tasks \
-H 'cache-control: no-cache' \
-H 'content-type: application/json' \
-d '{"id": "0", "task": "koapost", "resolved": "false"}'

*/

// Update one
router.put("/tasks/:id", async (ctx) => {
    let documentQuery = {"_id": ObjectID(ctx.params.id)}; // Used to find the document
    let valuesToUpdate = ctx.request.body;
    ctx.body = await ctx.app.tasks.updateOne(documentQuery, valuesToUpdate);
});

// Delete one
router.delete("/tasks/:id", async (ctx) => {
    let documentQuery = {"_id": ObjectID(ctx.params.id)}; // Used to find the document
    ctx.body = await ctx.app.tasks.deleteOne(documentQuery);
});

app.use(router.routes()).use(router.allowedMethods());
 
app.listen(5000);

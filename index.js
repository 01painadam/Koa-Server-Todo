'use strict';

const Koa = require('koa');
const Router = require('koa-router');
const BodyParser = require("koa-bodyparser");
const logger = require('koa-logger');

const app = new Koa();
const router = new Router;
const ObjectID = require("mongodb").ObjectID;
const TASK_JSON_PATH = "./todo.json";

require("./mongo")(app);
let fs = require('fs');

//LOCAL DATABASE FUNCTIONS/////////////////////////

let init = () => {
    //create file if it's not already present.
    if (!fs.existsSync(TASK_JSON_PATH)) {
        console.log("Initialising storage.\n Creating `tasklist.json` file");
        setData([]);
    }

}

let getData = () => {
    //read file contents
    let contents = fs.readFileSync(TASK_JSON_PATH);

    //parse contents
    let data = JSON.parse(contents);

    return data;
}


let setData = data => {
    //strigify JSON
    let dataString = JSON.stringify(data);

    //write to  file
    fs.writeFileSync(TASK_JSON_PATH, dataString);
}

let objectify = (x, id_count) => {
    let obj = {

        id: id_count,
        task: x,
        done: false

    }
    return obj;

}

let menu = () => {
    console.log('ADD: todo add <task description>');
    console.log('EDIT: todo edit <id> <new task description> ');
    console.log('DEL & RES: todo [del|res] <id>');
    console.log('Save: save todo list on remote MongoDB');
    console.log('List: todo list');
    console.log('Help: todo help');
}

let renumber = data => {

    for (let i in data) {

        data[i].id = i;

    }

    return data;

}

let list = () => {

    let data = getData();

    if (data.length > 0) {

        for (let i in data) console.log(data[i]);

    }
    else { console.log('\nNo tasks in list!\n'); }

}

let add = task => {

    let data = getData();
    let id = data.length;

    data.push(objectify(task, id));

    setData(data);

    //list();

}

let res = id => {

    let data = getData();

    //toggle whether task is resolved
    data[id].done = true;

    setData(data);

    list();

}

let del = id => {

    let data = getData();

    data.splice(id, 1);

    data = renumber(data);

    setData(data);

    list();

}

let edit = (id, edit) => {

    let data = getData();

    data[id].task = edit;

    setData(data);

    list();

}

//API ENDPOINTS////////////////////////////

// Use the bodyparser & logger middlware
app.use(BodyParser());
app.use(logger());

//to local host method
router.get("/", async function (ctx) {
    ctx.body = "Welcome to Todo List (Koa, Mongo, JS)"
});

// List all tasks in mongo db localhost using: http://localhost:5000/tasks
router.get("/remotetasks", async (ctx) => {
    ctx.body = await ctx.app.tasks.find().toArray();
});

// Save all tasks in mongo db to local using: http://localhost:5000/tasks
router.get("/download", async (ctx) => {
    ctx.body = "Tasks Downloaded to local database file"
    let tempArray = await ctx.app.tasks.find().toArray();
    console.log(tempArray);
    for(let i in tempArray) add(tempArray[i]);
});

// List all locally stored tasks on local host
router.get("/localtasks", async function (ctx) {    
    let taskList = getData();
    ctx.body = taskList;     //show whatever using cxt.body assignment
});

// Get one from LOCAL using id
router.get("/localtasks/:id", async (ctx) => {
    let x = getData();
    ctx.body = x[ctx.params.id];
});

// Get one from MONGO using id
router.get("/remotetasks/:id", async (ctx) => {
    
        console.log(ctx.params.id);
        ctx.body = await ctx.app.tasks.findOne({"_id": ObjectID(ctx.params.id)});
        //ctx.body = await ctx.app.tasks.findOne({"_id": ObjectID(ctx.params.id)});
    });

//manual POST ALL using CURL from LOCAL to MONGO
router.post("/", async function (ctx) {
    let taskList = getData();
    ctx.body = await ctx.app.tasks.insert(taskList);
});

// POST new task to mongo from CLI
router.post("/tasks", async (ctx) => {
    //should really use getdata to manually find id!
    ctx.body = await ctx.app.tasks.insert(ctx.request.body);
});

// Update one
router.put("/remotetasks/:id", async (ctx) => {
    let documentQuery = {"_id": ObjectID(ctx.params.id)}; // Used to find the document
    let valuesToUpdate = ctx.request.body.done;
    ctx.body = await ctx.app.tasks.updateOne(documentQuery, valuesToUpdate);
});

// Resolve one local
router.get("/localresolve/:id", async (ctx) => {
    console.log(ctx.params.id);
    res(ctx.params.id);
    let x = getData();
    ctx.body = x[ctx.params.id];
});

// Resolve one remote
router.patch("/remoteresolve/:id", async (ctx) => {
    let documentQuery = {"_id": ObjectID(ctx.params.id)}; // Used to find the document
    ctx.request.body.done = true; //swap resolved value
    let valuesToUpdate = ctx.request.body;
    ctx.body = await ctx.app.tasks.updateOne(documentQuery, valuesToUpdate);
});

// Resolve all remote
router.patch("/remoteresolveall", async (ctx) => {
    //ctx.request.body.done = true; //swap resolved value
    //let valuesToUpdate = ctx.request.body;
    ctx.body = await ctx.app.tasks.updateMany({}, {$set: {done: true}}, {multi: true});
});

// Delete one remote
router.delete("/remotetasks/:id", async (ctx) => {
    let documentQuery = {"_id": ObjectID(ctx.params.id)}; // Used to find the document
    ctx.body = await ctx.app.tasks.deleteOne(documentQuery);
});

// Delete ALL remote
router.delete("/remotedeleteall", async (ctx) => {
    ctx.body = await ctx.app.tasks.deleteMany();
});

app.use(router.routes()).use(router.allowedMethods());
 
app.listen(5000);






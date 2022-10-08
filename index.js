const express = require("express");
const app = express();
const port = 3000;
const AWS = require("aws-sdk");

require("dotenv/config");
app.set("view engine", "ejs");
app.set("views", "./views");
app.use(
    express.urlencoded({
        extended: true,
    })
);

app.use(express.json());

const tableName = "student"
AWS.config.update({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: process.env.AWS_REGION,
});
const dynamoDB = new AWS.DynamoDB.DocumentClient();

app.get("/", async(req, res, next) => {
    const students = await getAll()
        // console.log(students)
    res.render("index", {
        result: { students: students || [] },
    });
});
app.post("/", async(req, res, next) => {
    const { id, name, dayOfBirth, className } = req.body
    const object = await getById(id);
    if (object) {
        const students = await getAll()
        res.render("index", {
            result: { students: students || [], errors: ["id already exists "] },
        });
        return;
    }
    await addObject({ id, name, dayOfBirth, className })
    res.redirect("/")
});
app.post("/students/update", async(req, res, next) => {
    const { id, name, dayOfBirth, className } = req.body
    await addObject({ id, name, dayOfBirth, className })
    res.redirect("/")
});
app.get("/students/update/:id", async(req, res, next) => {
    const { id } = req.params;
    let student;
    try {
        student = await getById(id)

        if (!student) throw new Error()
    } catch (error) {
        res.redirect("/");
        return
    }
    res.render("update", {
        student
    });

});

app.post("/students/delete/:id", async(req, res, next) => {
    const { id } = req.params;
    try {
        await deleteObject(id)
    } catch (error) {
        console.log(error);
    }
    res.redirect("/");
});



app.listen(port, () => console.log(`Server start on http://localhost:${port}`));


// service
const addObject = async(entity) => {
    const params = {
        TableName: tableName,
        Item: {
            ...entity
        },
    };
    const data = await dynamoDB.put(params).promise();
    return {...data };
}
const deleteObject = async(id) => {
    const params = {
        TableName: tableName,
        Key: {
            id,
        },
    };
    return await dynamoDB.delete(params).promise();
}
const getById = async(id) => {
    const params = {
        TableName: tableName,
        Key: {
            id,
        },
    };
    const data = await dynamoDB.get(params).promise();
    return data.Item && data.Item
}
const getAll = async() => {
    const params = {
        TableName: tableName,
    };
    const data = await dynamoDB.scan(params).promise();
    return data.Items;
}
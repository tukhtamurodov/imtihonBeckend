let jwt = require("jsonwebtoken");
let joi = require("joi");
let path = require("path");
let uuid = require("uuid").v4;
let { SECRET_KEY } = require("../config");
let User = require("../models/user");
let IO = require("../libs/IO");
let userFile = new IO(path.resolve("database", "users.json"));

let scheme = new joi.object({
  username: joi.string().alphanum().min(5).max(32).required(),
  name: joi.string().min(2).max(32).required(),
});

const REGISTER_USER = async (req, res) => {
  try {
    let { name, username, password } = req.body;
    let image = req?.files?.image;
    let users = await userFile.read();

    if (!(name && password && username && image)) {
      throw new Error("malumotlar toliq emas yuborilmagan!");
    }
    let { error } = scheme.validate({ username, name });
    if (error) {
      throw new Error(error.message);
    }

    let findIndex = users.findIndex((u) => u.username == username);

    if (findIndex > -1) {
      throw new Error("bu username band, bosha username tanlang");
    }

    let fileType = path.extname(image.name);
    let imageName = uuid() + fileType;

    let id = (users?.at(-1)?.id || 0) + 1;
    let user = new User(id, name, username, password, imageName);
    let pathImg = path.resolve("fileUpload", imageName);

    users.push(user);
    image.mv(pathImg);

    userFile.write(users);
    let token = jwt.sign({ id }, SECRET_KEY);

    res.cookie("token", token);
    res.status(200).json({ message: "success", token });
  } catch (err) {
    res.status(400).json({ status: 400, message: err.message });
  }
};

module.exports = { REGISTER_USER };

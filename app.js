
const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");
const ejs = require("ejs");
const app = express();

app.set("view engine", "ejs");
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

mongoose.set("strictQuery", false);
mongoose.connect(
  "mongodb+srv://admin:58EEa0QKh1WJZrIM@cluster0.3xunqfg.mongodb.net/todolistDB"
);

///item schema/////
const itemsSchema = new mongoose.Schema({
  name: String,
});

const Item = mongoose.model("Item", itemsSchema);

const item1 = new Item({ name: "Welcome to your todo-list" });
const item2 = new Item({ name: "Hit the + button to add a new item" });
const item3 = new Item({ name: "<-- Hit this to delete an item" });

const defaultItems = [item1, item2, item3];

const listSchema = new mongoose.Schema({
  name: String,
  items: [itemsSchema],
});

/////////////////////List schema////////////
const List = mongoose.model("List", listSchema);

const work = new List({
  name: "Work",
  items: [
    new Item({ name: "Finish project" }),
    new Item({ name: "Prepare presentation" }),
    new Item({ name: "Respond to emails" }),
  ],
});

const study = new List({
  name: "Study",
  items: [
    new Item({ name: "Read textbook" }),
    new Item({ name: "Do practice problems" }),
    new Item({ name: "Review notes" }),
  ],
});

const life = new List({
  name: "Life",
  items: [
    new Item({ name: "Go grocery shopping" }),
    new Item({ name: "Do laundry" }),
    new Item({ name: "Go for a walk" }),
  ],
});

const defaultLists = [work, study, life];

defaultLists.forEach((defaultList) => {
  List.findOne({ name: defaultList.name }, (err, foundList) => {
    if (!foundList) {
      const newList = new List({
        name: defaultList.name,
        items: defaultList.items,
      });
      newList.save();
    }
  });
});

///////////tab schema
const tabSchema = new mongoose.Schema({
  name: String,
});

const Tab = mongoose.model("Tab", tabSchema);

const tab1 = new Tab({ name: "Work" });
const tab2 = new Tab({ name: "Study" });
const tab3 = new Tab({ name: "Life" });

const defaultTabs = [tab1, tab2, tab3];

defaultTabs.forEach((defaultTab) => {
  Tab.findOne({ name: defaultTab.name }, (err, foundTab) => {
    if (!foundTab) {
      const newTab = new Tab({
        name: defaultTab.name,
      });
      newTab.save();
    }
  });
});

app.get("/", (req, res) => {
  const currentUrlPath = req.originalUrl;
  Item.find({}, (err, foundItems) => {
    if (foundItems.length === 0) {
      Item.insertMany(defaultItems, (err) => {
        if (err) {
          console.log(err);
        } else {
          console.log("insert Successfully");
        }
      });
      res.redirect("/");
    } else {
      Tab.find({}, (err, foundTabs) => {
        if (!err) {
          res.render("layout", {
            listTitle: "Today",
            newListItems: foundItems,
            tabs: foundTabs,
            currentUrlPath: currentUrlPath,
          });
        }
      });
    }
  });
});

app.get("/:customListName", (req, res) => {
  const customListName = _.capitalize(req.params.customListName);
  const currentUrlPath = req.originalUrl;
  List.findOne({ name: customListName }, (err, foundList) => {
    if (!err) {
      if (!foundList) {
        //Create a new list
        const list = new List({
          name: customListName,
          items: defaultItems,
        });

        list.save();
        Tab.findOne({ name: customListName }, (err, foundTab) => {
          if (!err) {
            if (!foundTab) {
              const tab = new Tab({
                name: customListName,
              });
              tab.save();
            }
          }
        });
        res.redirect("/" + customListName);
      } else {
        Tab.find({}, (err, foundTabs) => {
          if (!err) {
            res.render("layout", {
              listTitle: foundList.name,
              newListItems: foundList.items,
              tabs: foundTabs,
              currentUrlPath: currentUrlPath,
            });
          }
        });
      }
    }
  });
});

app.post("/", (req, res) => {
  const itemName = req.body.newItem;
  const listName = req.body.list;

  const item = new Item({ name: itemName });

  if (listName == "Today") {
    item.save();
    res.redirect("/");
  } else {
    List.findOne({ name: listName }, (err, foundList) => {
      foundList.items.push(item);
      foundList.save();
      res.redirect("/" + listName);
    });
  }
});

app.post("/delete", (req, res) => {
  const checkedItemId = req.body.checkbox;
  const listName = req.body.listName;

  if (listName === "Today") {
    Item.findByIdAndRemove(checkedItemId, (err) => {
      if (!err) {
        console.log("item has been deleted");
        res.redirect("/");
      }
    });
  } else {
    List.findOneAndUpdate(
      { name: listName },
      { $pull: { items: { _id: checkedItemId } } },
      (err, foundList) => {
        if (!err) {
          res.redirect("/" + listName);
        }
      }
    );
  }
});

app.post("/newTabName", (req, res) => {
  const newTabName = _.capitalize(req.body.newTabName);

  if (newTabName === "Today") {
    res.redirect("/");
  } else {
    Tab.findOne({ name: newTabName }, (err, foundTab) => {
      if (!err) {
        if (!foundTab) {
          //Create a new tab
          const tab = new Tab({
            name: newTabName,
          });
          tab.save();
          res.redirect("/" + newTabName);
        } else {
          res.redirect("/" + newTabName);
        }
      }
    });
  }
});

app.post("/:customListName/delete", function (req, res) {
  const customListName = _.capitalize(req.params.customListName);
  List.deleteOne({ name: customListName }, function (err) {
    if (err) {
      console.log(err);
    } else {
      console.log("Successfully deleted the list.");
      Tab.deleteOne({ name: customListName }, function (err) {
        if (err) {
          console.log(err);
        } else {
          console.log("Successfully deleted the tab.");
          res.redirect("/");
        }
      });
    }
  });
});

let port = process.env.PORT;
if (port == null || port == "") {
  port = 8000;
}
app.listen(port, () => {
  console.log("Server started on port 3000");
});

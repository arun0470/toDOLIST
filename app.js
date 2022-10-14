//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const mongoose =require("mongoose");
const lodash = require("lodash");

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));
mongoose.connect("mongodb://localhost:27017/todolistDB",{useNewUrlParser:true});


const workItems = [];

const itemsSchema = {
  name:String,
};
const Item = mongoose.model("Item",itemsSchema);
const item1 = new Item({
  name:"Welcome to todolist!",
});
const item2 = new Item({
  name:"Hit + button to add a new item."
});
const item3 = new Item({
  name:"<-- Hit this to delte an item."
});

const defaultItems = [item1,item2,item3];
const listSchema ={
  name:String,
  items:[itemsSchema]
};

const List = mongoose.model("List",listSchema);



app.get("/", function(req, res) {
  Item.find({},function(err,foundItems){
    if(foundItems.length == 0){
      Item.insertMany(defaultItems,function(err){
        if(err){
          console.log(err);
        }else{
          console.log("successfully saved default items to databse");
        }
      });
      res.redirect("/");
    }
    else{
      res.render("list",{listTitle:"Today",newListItems:foundItems})
    }
  });
});

app.get("/:customListName",function(req,res){
  const customListName = lodash.capitalize(req.params.customListName);

  List.findOne({name:customListName},function(err,foundList){
    if(!err){
      if(!foundList){
        const list = new List({
          name:customListName,
          items:defaultItems
        });
        list.save();
        res.redirect("/"+customListName);
      }else{
        res.render("list",{listTitle:foundList.name,newListItems:foundList.items});
      }
    }
  })

});

app.post("/", function(req, res){

  const itemName = req.body.newItem;
  const listname = req.body.list;
  const item = new Item({
    name:itemName,
  });

  if(listname == "Today"){
    item.save();
    res.redirect("/");
  }else{
    List.findOne({name:listname},function(err,foundList){
      foundList.items.push(item);
      foundList.save();
      res.redirect("/"+listname);
    })
  }
});

app.post("/delete",function(req,res){
  const item_requestedToDelete = req.body.checkbox;
  const listname= req.body.listname;
  if(listname === "Today"){
    Item.findByIdAndRemove(item_requestedToDelete,function(err){
      if(!err){
        console.log("successfully deleted the item from the database");
        res.redirect("/");
      }
    });
  }else{
    List.findOneAndUpdate({name:listname},{$pull:{items:{_id:item_requestedToDelete}}},function(err,foundList){
      if(!err){
        res.redirect("/"+listname);
      }
    });
  }
});


app.get("/about", function(req, res){
  res.render("about");
});

app.listen(3000, function() {
  console.log("Server started on port 3000");
});

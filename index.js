require('dotenv').config()
const express = require('express');
const bodyParser = require('body-parser');
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const userModel = require("./Model/userModel");
const Post= require("./Model/postModel");



const app = express();
const port = process.env.PORT || 3200;

// Parse incoming requests with JSON payloads
app.use(bodyParser.json());

// Coonect to the database
const db= require("./Config/database")


// router handlers 
app.get('/home', (req, res) => {
  res.status(200).json('You are welcome');
})

// register user
app.post('/register', async(req, res) => {
  const {fullname, email, password} = req.body 

  // hash password 
  const hashedpassword = await bcrypt.hash(password, 10); 
  
  const newUser =  new userModel({
    fullname,
    email,
    password: hashedpassword
  })

  const userCreated = await newUser.save()
  if(!userCreated) {
    console.log("user cannot be created");
    return res.status(500).send("user cannot be created")
  } else {
    console.log("user has been created to the database");
    return res.status(200).send("user has been created to the database")
  }

});



// login route
app.post('/login', async(req, res) => {
  const { email, password } = req.body;

  // Find by email
  const user = await userModel.findOne({ email });
    console.log("++++++++++++",user)
  if (!user) {
    return res.status(401).send('Invalid email or password');
  }

  // Check if password is correct
  const isPasswordCorrect = await bcrypt.compare(password, user.password);
  console.log("++++++++++++",isPasswordCorrect)
  if (!isPasswordCorrect) {
    // If the password is incorrect return error
    return res.status(401).send('Invalid email or password');
  }

  app.get("/userprofile",async(req,res)=>{
    try{
      const user=await userModel.findById(req.user.id).select("-password");
      res.json(user);
    }
    catch(err){
      res.json({msg:[{msg:'server error'}]})
    }
  })

 
 // create a JWT token
  // Secrete Key saved in .env file
  const mysecretkey = process.env.SECRET_CODE;

  // Payload
  const payload = {
    fullName: user.fullname,
    email: user.email,
    password: user.password,
  };
  console.log("+++++++payload+++++",mysecretkey)
  // Create a jsonwebtoken
  const token = jwt.sign(payload, mysecretkey, { expiresIn: '5d' });
  console.log(token)
  // Send the token back to the client
  res.status(200).json({
    msg: "User is logged in",
    token: token
  });
});

app.get('/protected', async(req, res) => {
  const token = req.headers.authorization.split(' ')[1]; // Get token from Authorization header
  const mysecretkey = process.env.SECRET_CODE;
  try {
    // Verify token
    const decoded = jwt.verify(token, mysecretkey);

    // Get user email from payload
    const userEmail = decoded.email;

    // Find user by email in the database
    const user = await userModel.findOne({ email: userEmail });

    if (user) {
      res.json({ message: `Welcome ${user.fullname}! This is a protected route.` });
    } else {
      res.status(401).json({ error: 'Invalid token' });
    }
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
});

  /*app.post("/",async(req,res)=>{
  const{fullname,school,city,email }=req.body
  const abc= await Post.create({
    fullname:fullname,
    school:school,
    city:city,
    email:email,
    //userId:userId
  }) 
  res.json(abc)
})*/

//post user with authentication

 app.post("/",async(req,res)=>{
    try{

const {fullname,school,city,email,ObjectId}=req.body

const token=req.headers.authorization
const decode=jwt.verify(token,secretKey)   
const object_id=decode.find_username._id 
 

const obj={

    fullname,
    school,
    city,
    email,
    ObjectId:object_id
}

const find=await userModel.findOne({_id:object_id})

if(find){

    const data=new Post(obj)

    const savedata=await data.save()


    if(savedata){
        res.status(200).json({message:"data uploaded successfully",savedata})
    }else(
        res.status(400).json({message:"data not upload /problem in code"})
    )

}

    }catch(error){
        console.log(error)
        res.status(400).json({message:error})
    }
})

//update wiyh authantication




 app.put("/",async(req,res)=>{

  try{
 
 const {fullname,email}=req.body
 
 const token=req.headers.authorization
 const decode=jwt.verify(token,secretKey) 
 const User_id=decode.find_username._id
 
 
 const path={
     fullname,
    email,
     ObjectId:User_id
 }
 
 
 const checkid=await Post.findOne({$and:[{fullname},{email},{ObjectId:User_id}]})
 
 if(checkid){
  const data= new Post(path)
 const savedata= await data.save
 
     res.status(200).json({message:"data updated successfully"},savedata)
     }else{
     res.status(400).json({message:"id not match / you are not the owner of this image"})
     }
     }catch(error){
         console.log(error)
         res.status(400).json(error)
     }
 })


// Start the server
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}/`);
});
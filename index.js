const express = require("express");
const mysql=require("mysql");
const cors=require("cors");
const app=express();
const path = require('path');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const { response } = require('express');
const saltRounds = 10;
const fs=require('fs');
const multer=require('multer');
require('dotenv').config();
const accountsid=process.env.ACCOUNT_SID;
const authToken=process.env.AUTH_TOKEN;
const client=require('twilio')(accountsid,authToken);
const JWT_AUTH_TOKEN=process.env.JWT_AUTH_TOKEN;
const JWT_REFRESH_TOKEN=process.env.JWT_REFRESH_TOKEN;

const smakey=process.env.SMS_SECRET_KEY;
app.use(express.json());


const cookieParser=require('cookie-parser');
const session = require('express-session');
const bodyParser = require('body-parser');
//const { ConnectionPolicyContext } = require("twilio/lib/rest/voice/v1/connectionPolicy");


app.use(cors({
  origin:["http://localhost:3000"],
  methods:["GET","POST","PUT"],
  credentials:true 
}));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended:true}));
app.use(cookieParser());
app.use(session({
  key:"customer_id",
  secret:"subscribe",
  resave:false,
  saveUninitialized:false,
  cookie:{
    expires:60*60*24,
  },
}));
app.set("view engine","ejs");

const db=mysql.createConnection({
  user:"root",
  host:"localhost",
  password:"",
  database:"eut_furniture",
});

const storage=multer.diskStorage({
    destination(req,file,cb){
        cb(null,'../eutfurniture/public')
    },
    filename(req,file,cb) {
       console.log(file)
        cb(null,
            `${file.originalname.split('.')[0]}.jpg`
            )
    }
})
const upload=multer({storage,
   fileFilter(req,file,cb){
    if(!file.originalname.match(/\.(jpeg|jpg|png)$/i)){
      return  cb(new Error('pleaseupload image with type of'))
    }
    cb(undefined,true)
}
})







 

app.post("/customization",(req,res)=> {
   
    const image=req.body.image;
    const name=req.body.name;
    const description=req.body.description;
    const measurement=req.body.measurement;
    const color =req.body.color;
    const material=req.body.material; 
    
      db.query(
        "INSERT INTO custproducts(description,color,product_name,measurement,material,image) VALUES (?,?,?,?,?,?)",[description,color,name,measurement,material,image],
        (err,result) =>{
            if(err){
                console.log(err)
            }else{
                res.send("values sended");
            }
        }
        );
    
        
      
    })

app.post("/upload",upload.single('file'),(req,res)=> {
   
})
app.get("/display",(req,res) =>{
    
   

    db.query("SELECT image,product_name FROM custproducts",(err,result) =>{
     
            if(err) throw err;
                   res.send(result);
                 });
        
   
})

app.post("/register",(req,res) => {
   const fname=req.body.fname;
   const lname=req.body.lname;
   const email=req.body.email;
   const phone=req.body.phone;
   const address=req.body.address;
   const password=req.body.password;
   const cpassword=req.body.cpassword;
  

  if(password == cpassword){
   
    db.query(
        "INSERT INTO customer(fname,lname,email,phone,address,password) VALUES (?,?,?,?,?,?)",[fname,lname,email,phone,address,password],
        (err,result) =>{
            if(err){
                console.log(err)
            }else{
                res.send({message:"values sended"});
            }
        }
        );
    }
    else{
        res.send({message:"check password"})
    }
      
}); 
app.get("/login",(req,res)=>{
  if(req.session.user){
    res.send({loggedIn:true,user:req.session.user});
  }else{
    res.send({loggedIn:false});
  }
});

app.post('/login',(req,res)=>{
  
  const email = req.body.email;
  const password = req.body.password;
 
  db.query(
      "SELECT *FROM customer WHERE email=?;",
     email,
      (err,result)=>{
          console.log(result)
          
          
          if(err)
          { 
              res.send({err:err})
          } 
          if(result.length > 0){
              
           if(password==result[0].password) {
                 req.session.user=result;
                 console.log(req.session.user);   
                 res.send(result);
                }
                else{
                 
                 res.send({message:"Invalid Username or Password"});
                
                }
            }
         })
        
      });
   app.get('/customer', (req, res) => {
        db.query("SELECT * FROM customer ;", (err, results, fields) => {
           if(err) throw err;
           res.send(results);
         });
       });
 app.get('/profile', (req, res) => {
         let id=req.query.id;
        db.query("SELECT * FROM customer WHERE customer_id=? ",[id], (err, results, fields) => {
           if(err) throw err;
           res.send(results);
         });
       });

app.put("/feedback",(req,res) => {
    const star=req.body. currentValue;
    const discription=req.body. discript;
   let id=req.query.id;
    db.query(
        "UPDATE customer SET star=? , feedback=? WHERE customer_id=?",[star,discription,id],
        (err,result) =>{
            if(err){
                console.log(err)
            }
        }
        );
        console.log(star);
        console.log(discription);
   
})
// app.post('/sendOTP', (req,res) =>{
//     const phone=req.body.phone;
//     const otp=Math.floor(100000 +Math.random()*900000)
//     const ttl=2*60*1000
//     const expires=Date.now()+ttl;
//     const data=`${phone}.${otp}.${expires}`;
//     const hash=crypto.createHmac('sha256',smsKey).update(data).digest('hex');
//     const fulhash=`${hash}.${expires}`;

//     // client.messages.create({
//     //     body:`Your verification code for Register EUT shop is  ${otp}`,
//     //     from:+13312561756,
//     //     to:phone
     
//     // }).then((messages) => console.log(messages)).catch((err) => console.error(err))
//  res.status(200).send({phone,hash:fulhash,otp});
// });

// app.post('/verifyOTP',(req,res) =>{
//     const phone=req.body.phone;
//     const hash=req.body.hash;
//     const otp=req.body.otp;
//     let[hashValue,expires]=hash.split('.')

//     let now=Date.now();
//     if(now >parseInt(expires)){
//         return res.status(504).send({msg:`Timeout pls Try again`});
//     }
//     const data=`${phone}.${otp}.${expires}`
//     const newCalculatedHash =crypto.createHmac('sha256',smsKey).update(data).digest('hex')

//     if(newCalculatedHash === hashValue){
//         return res.status(202).send({msg:`user confirmed`});
//         const accessToken =jwt.sign({data:phone} ,JWT_AUTH_TOKEN,{expiresIn:'30s'});
//         const refreshToken =jwt.sign({data:phone},JWT_REFRESH_TOKEN,{expiresIn:'30s'});
    
//     }else{
//         return res.status(400).send({verification :false,msg:`incorrect OTP`});
//     }
// })
 
   app.get('/pposts', (req, res) => {
    db.query("SELECT * FROM product WHERE category_id=3 ;", (err, results, fields) => {
       if(err) throw err;
       res.send(results);
     });
   });

 
  
    
app.listen(3001,() => {
    console.log("running sever");
});
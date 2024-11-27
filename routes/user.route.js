const express= require('express');
const bcrypt= require('bcrypt');
const UserModel = require('../models/user.model');
const jwt= require('jsonwebtoken');
const dotenv= require('dotenv');
const multer = require('multer');
dotenv.config()

const userRouter= express.Router()

// const storage= multer.diskStorage({
//     destination: (req, file, cb)=>{
//         cb(null, 'uploads/UserProfiles/');
//     },
//     filename: (req, file, cb)=>{
//         cb(null, `${Date.now()}-${file.originalname}`)
//     }
// })

// const upload= multer({storage});


userRouter.post('/register', async(req, res)=>{
    const {name, email, password, role}= req.body;
    try {
        const existedUser= await UserModel.findOne({email});
        if(existedUser){
            return res.status(409).json({message: 'User Already Exist'})
        }
        const hash = await bcrypt.hash(password, 2);
        // Create the user with the hashed password
        const user = new UserModel({ name, email, password: hash, role });
        await user.save();
        res.status(201).send({message: 'User Registration successfull'})
    } catch (error) {
        res.status(400).send({message: 'User Registration failed', error: error.message})
    }
})

userRouter.post('/login', async(req, res)=>{
    const {email, password, role}= req.body;
    try {
        const user= await UserModel.findOne({email, role});

        if(!user){
            return res.status(404).send({message: `No user found with the specified role ${role}`})
        }
        
        const isPasswordValid= await bcrypt.compare(password, user.password);

        if(!isPasswordValid){
            return res.status(401).send({message: 'Incorrect password'});
        }

        const token= jwt.sign(
            {userId: user._id, email: user.email, name: user.name, role: user.role}, 
            process.env.JWT_SECRET
        );
        // console.log(token)
        res.status(200).send({message: 'successfully login', token })
        
    } catch (error) {
        res.status(500).send({message: 'User Login failed', error: error.message})
    }
})

module.exports= userRouter
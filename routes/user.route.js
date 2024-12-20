const express= require('express');
const bcrypt= require('bcrypt');
const UserModel = require('../models/user.model');
const jwt= require('jsonwebtoken');
const multer = require('multer');
const cloudinary= require('cloudinary').v2;
const dotenv= require('dotenv');
dotenv.config()

const userRouter= express.Router()

const storage= multer.diskStorage({
    // destination: (req, file, cb)=>{
    //     cb(null, 'uploads/UserProfiles/');
    // },
    filename: (req, file, cb)=>{
        cb(null, `${Date.now()}-${file.originalname}`)
    }
})

const upload= multer({storage});


userRouter.post('/register', async(req, res)=>{
    const {name, email, password, role}= req.body;
    try {
        const existedUser= await UserModel.findOne({email});
        if(existedUser){
            return res.status(409).json({message: 'User Already Exist'})
        }
        const hash = await bcrypt.hash(password, 2);
        // Create the user with the hashed password
        const user = new UserModel({ name, email, password: hash, role, image: '', phone: '', address: '',  gender: '', DOB: '' });
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
            {_id: user._id, email: user.email, name: user.name, role: user.role, image: user.image, phone: user.phone, address: user.address,  gender: user.address, DOB: user.DOB}, 
            process.env.JWT_SECRET
        );
        // console.log(token)
        res.status(200).send({message: 'successfully login', token })
        
    } catch (error) {
        res.status(500).send({message: 'User Login failed', error: error.message})
    }
})

userRouter.patch('/update-profile/:userId', upload.single('profilePic'), async (req, res) => {
    const { name, phone, address, gender, DOB } = req.body;
    const { userId } = req.params;

    try {
        let updateData = { name, phone, address, gender, DOB };

        if (req.file) {
            const cloudinaryResult = await cloudinary.uploader.upload(req.file.path, {
                folder: 'patient_images',
            });
            updateData.image = cloudinaryResult.secure_url;
        }

        const updatedUser = await UserModel.findByIdAndUpdate(
            userId,
            updateData,
            { new: true } // Return the updated document
        );

        if (!updatedUser) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.json({ message: 'Profile updated successfully', data: updatedUser });
    } catch (error) {
        console.error('Error updating profile:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});


module.exports= userRouter
const express = require('express');
const multer = require('multer');
const DoctorModel = require('../models/doctor.model');
const doctorRouter = express.Router();
const bcrypt= require('bcrypt');
const cloudinary = require('cloudinary').v2;
const {CloudinaryStorage}= require('multer-storage-cloudinary');
const dotenv = require('dotenv');
dotenv.config();


const storage = multer.diskStorage({
    // destination: (req, file, cb) => {
    //     cb(null, 'uploads/')
    // },
    filename: (req, file, cb) => {
        cb(null, `${Date.now()}-${file.originalname}`)
    }
})
// Configure Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

const upload = multer({ storage });

doctorRouter.post('/add', upload.single('image'), async (req, res) => {
    const { name, email, password, fees, speciality, experience, address, about } = req.body;
    try {
        const cloudinaryResult= await cloudinary.uploader.upload(req.file.path,{
            folder: 'doctor_images'
        })

        const hashPassword= await bcrypt.hash(password, 2);
        const doctor = new DoctorModel({
            name,
            email,
            password: hashPassword,
            fees,
            speciality,
            experience,
            address,
            about,
            image: cloudinaryResult.secure_url,
            isAvailable: true
        })
        await doctor.save()

        res.status(201).json({ message: 'New Doctor added successfully.' })
    } catch (error) {
        console.log(error);
        // res.status(500).json({ message: error.message })
    }
})

doctorRouter.get('/getdoctors', async (req, res) => {
    // const {specialist}= req.query;
    // If specialist is 'all' or not provided, fetch all doctors
    //  const filter = specialist === 'all' || !specialist ? {} : { speciality: specialist };
    try {
        const doctors = await DoctorModel.find();
        // const doctorsWithImages = doctors.map((doctor) => ({
        //     ...doctor.toObject(),
        //     image: `data:${doctor.imageType};base64,${doctor.image.toString('base64')}`;
        // }))
        res.status(200).json({ success: true, data: doctors })
    } catch (error) {
        res.status(500).json({ message: error.message })
    }
});

doctorRouter.patch('/update/:id', async (req, res) => {
    const { isAvailable } = req.body;
    const { id } = req.params;

    try {
        const updateDoctor = await DoctorModel.findByIdAndUpdate(id, { $set: { isAvailable } }, { new: true });
        const doctors = await DoctorModel.find();
        // const doctorsWithImages = doctors.map((doctor) => ({
        //     ...doctor.toObject(),
        //     image: `data:${doctor.imageType};base64,${doctor.image.toString('base64')}`
        // }))
        res.status(200).json({ message: 'Availability Status Updated Successfull', data: doctors })
    } catch (error) {
        res.status(500).json({ message: 'Fail To update Availability status' })
    }
})

// ---------patient side------

doctorRouter.get('/singledoctor/:id', async (req, res) => {
    const { id } = req.params;

    try {
        const doctor = await DoctorModel.findById({ _id: id })
        // const doctorWithImage = {
        //     ...doctor.toObject(),
        //     image: `data:${doctor.imageType};base64,${doctor.image.toString('base64')}`
        // }
        res.status(200).json({ message: 'single Doctor got', data: doctor })
    } catch (error) {
        res.status(500).json({ message: error.message })
    }
})

doctorRouter.get('/get-available-doctors', async (req, res) => {
    // console.log(req.query.specialist)
    const { specialist } = req.query;
    // If specialist is 'all' or not provided, fetch all doctors
    const filter = specialist === 'all' || !specialist ? {} : { speciality: specialist };
    filter.isAvailable = true;
    try {
        const doctors = await DoctorModel.find(filter);
        // const doctorsWithImages= doctors.map((doctor)=> ({
        //     ...doctor.toObject(),
        //     image: `data:${doctor.imageType};base64,${doctor.image.toString('base64')}`
        //     // image: `data:${doctor.imageType};base64,${doctor.image.toString('base64')}`
        // }))
        // const doctorsWithImages = doctors.map((doctor) => ({
        //     ...doctor.toObject(),
        //     image: `data:${doctor.imageType};base64,${doctor.image.toString('base64')}`
        // }))
        res.status(200).json({ success: true, data: doctors })
    } catch (error) {
        res.status(500).json({ message: error.message })
    }
});

// ---------get 10 doctors to show in home page---------
doctorRouter.get('/get-10-doctors', async (req, res) => {
    try {
        const doctors = await DoctorModel.find({ isAvailable: true }).limit(10);
        res.status(200).json({ doctors })
    } catch (error) {
        res.status(500).json({ message: `Internal server error ${error.message}` })
    }
})


module.exports = doctorRouter;
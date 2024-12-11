const express = require('express');
const multer = require('multer');
const DoctorModel = require('../models/doctor.model');
const doctorRouter = express.Router();

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/')
    },
    filename: (req, file, cb) => {
        cb(null, `${Date.now()}-${file.originalname}`)
    }
})

const upload = multer({ storage });

doctorRouter.post('/add', upload.single('image'), async(req, res) => {
    const { name, email, password, fees, speciality, experience, address, about } = req.body;
    try {
        const doctor = new DoctorModel({
            name,
            email,
            password,
            fees,
            speciality,
            experience,
            address,
            about,
            image: `/uploads/${req.file.filename}`,
            isAvailable: true
        })
        await doctor.save()

        res.status(201).json({message: 'New Doctor added successfully.'})
    } catch (error) {
        res.status(500).json({ message: error.message })
    }
})

doctorRouter.get('/getdoctors', async(req, res)=>{
    // const {specialist}= req.query;
     // If specialist is 'all' or not provided, fetch all doctors
    //  const filter = specialist === 'all' || !specialist ? {} : { speciality: specialist };
    try {
        const doctors= await DoctorModel.find();
        res.status(200).json({success: true, data: doctors})
    } catch (error) {
        res.status(500).json({message: error.message})
    }
});

doctorRouter.patch('/update/:id', async(req, res)=>{
    const {isAvailable}= req.body;
    const {id}= req.params;

    try {
        const updateDoctor= await DoctorModel.findByIdAndUpdate(id, {$set: {isAvailable}}, {new: true});
        const doctors= await DoctorModel.find();
        res.status(200).json({message: 'Availability Status Updated Successfull', data: doctors})
    } catch (error) {
        res.status(500).json({message: 'Fail To update Availability status'})
    }
})

// ---------patient side------

doctorRouter.get('/singledoctor/:id', async(req, res)=>{
    const {id}= req.params;

    try {
        const doctor= await DoctorModel.findById({_id:id })
        res.status(200).json({message: 'single Doctor got', data: doctor})
    } catch (error) {
        res.status(500).json({message: error.message})
    }
})

doctorRouter.get('/get-available-doctors', async(req, res)=>{
    // console.log(req.query.specialist)
    const {specialist}= req.query;
     // If specialist is 'all' or not provided, fetch all doctors
     const filter = specialist === 'all' || !specialist ? {} : { speciality: specialist };
     filter.isAvailable= true;
    try {
        const doctors= await DoctorModel.find(filter);
        res.status(200).json({success: true, data: doctors})
    } catch (error) {
        res.status(500).json({message: error.message})
    }
});

// ---------get 10 doctors to show in home page---------
doctorRouter.get('/get-10-doctors', async(req, res)=>{
    try {
        const doctors= await DoctorModel.find({isAvailable: true}).limit(10);
        res.status(200).json({doctors})
    } catch (error) {
        res.status(500).json({message: `Internal server error ${error.message}`})
    }
})


module.exports = doctorRouter;
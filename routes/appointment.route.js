const express= require('express');
const AppointmentModel = require('../models/appointment.model');
const verifyToken = require('../middleware/verifyToken');

const appointmentRouter= express.Router();

appointmentRouter.post('/book-appointment/:doctorId', verifyToken, async(req, res)=>{
    const {date, time, fees, patientId }= req.body;
    const {doctorId}= req.params;

    try {
        const appointment= new AppointmentModel({doctorId, patientId, date, time, fees});
        await appointment.save()
        res.status(201).json({message: 'appointment Booked successfully, wait for approval'});
    } catch (error) {
        res.status(500).json({message: 'Fail to book appointment'})
    }
})

appointmentRouter.get('/all-appointments', async(req, res)=>{
    try {
        const appointments= await AppointmentModel.find().populate('doctorId', '-password').populate('patientId');
        res.status(200).json({message: 'all appointments get successfully', appointments})
    } catch (error) {
        res.status(500).json({message: 'Internal server error/ fail to get all appointments'});
    }
})

appointmentRouter.get('/my-appointments',verifyToken, async(req, res)=>{
    const {patientId}= req.body;
    try {
        const appointments= await AppointmentModel.find({patientId}).populate('doctorId', '-password');
        res.status(200).json({message: 'your appointments get successfully', appointments})
    } catch (error) {
        res.status(500).json({message: 'Internal server error/ fail to get your appointments'})
    }
})

// -----admin------
//only Admin can be confirm the appointment
appointmentRouter.patch('/confirm/:id', async(req, res)=>{
    const {id}= req.params;
    try {
        const appointment= await AppointmentModel.findByIdAndUpdate(id, {status: 'Confirmed'}, {new: true});
        
        res.status(200).json({message: 'Appointment confirmed successfully'})

    } catch (error) {
        res.status(500).json({message: 'Internal server error'})
    }
})

//patient/ Admin can cancel the appointment
appointmentRouter.patch('/cancel/:id', async(req, res)=>{
    const {id}= req.params;
    try {
        await AppointmentModel.findByIdAndUpdate(id, {status: 'Cancelled'}, {new: true});

        res.status(200).json({message: 'Appointment cancelled successfully'})
    } catch (error) {
        res.status(500).json({message: 'Internal server error'})
    }
})

module.exports= appointmentRouter;
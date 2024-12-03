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

// const isAppointmentCompleted = (appointmentDate, appointmentTime) => {
//     const [day, month, year] = appointmentDate.split("-").map(Number); // Parse date
//     const [time, meridian] = appointmentTime.split(" "); // Separate time and AM/PM
//     let [hours, minutes] = time.split(":").map(Number); // Split hours and minutes

//     // Convert 12-hour time to 24-hour format
//     if (meridian === "PM" && hours !== 12) {
//         hours += 12;
//     } else if (meridian === "AM" && hours === 12) {
//         hours = 0;
//     }

//     // Create a Date object for the appointment
//     const appointmentDateTime = new Date(year, month - 1, day, hours, minutes);

//     // Get the current date and time
//     const currentDateTime = new Date();

//     console.log(appointmentDateTime, currentDateTime)

//     // Return true if the appointment date and time are in the past
//     return appointmentDateTime < currentDateTime;
// };



// appointmentRouter.get('/all-appointments', async(req, res)=>{
//     try {
//         const appointments = await AppointmentModel.find()
//             .populate('doctorId', '-password')
//             .populate('patientId');

//         // Update status for completed appointments
//         const updatedAppointments = await Promise.all(
//             appointments.map(async (appointment) => {
//                 if (
//                     appointment.status !== "Completed" &&
//                     appointment.status !== "Cancelled" &&
//                     appointment.status == "Pending" &&
//                     isAppointmentCompleted(appointment.date, appointment.time)
//                 ) {
//                     appointment.status = "Completed";
//                     await appointment.save();
//                 }
//                 return appointment;
//             })
//         );

//         res.status(200).json({
//             message: 'All appointments retrieved successfully',
//             appointments: updatedAppointments
//         });
//     } catch (error) {
//         res.status(500).json({message: 'Internal server error/ fail to get all appointments'});
//     }
// })

const isAppointmentCompleted = (appointmentDate, appointmentTime) => {
    try {
        // Parse the date in dd-mm-yyyy format
        const [year, month, day] = appointmentDate.split("-").map(Number);

        // Parse the time in hh:mm AM/PM format
        const [time, meridian] = appointmentTime.split(" ");
        let [hours, minutes] = time.split(":").map(Number);

        // Convert to 24-hour format
        if (meridian === "PM" && hours !== 12) {
            hours += 12;
        } else if (meridian === "AM" && hours === 12) {
            hours = 0;
        }

        // Construct a valid ISO-compliant date string
        const formattedDateTime = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}T${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:00.000Z`;
        // Create a Date object
        const appointmentDateTime = new Date(formattedDateTime);
 
        // Get the current date and time
        const currentDateTime = new Date();
        // console.log(`current date ${currentDateTime}`)
        // console.log(`appointment date ${appointmentDateTime}`)

        // Return true if the appointment is in the past
        return appointmentDateTime < currentDateTime;
    } catch (error) {
        console.error("Error in isAppointmentCompleted:", error);
        return false;
    }
};



appointmentRouter.get('/all-appointments', async (req, res) => {
    try {
        const appointments = await AppointmentModel.find()
            .populate('doctorId', '-password')
            .populate('patientId');

         // Iterate and update completed appointments status as 'Completed'
         for (const appointment of appointments) {
            if (
                isAppointmentCompleted(appointment.date, appointment.time) &&
                appointment.status === 'Confirmed'
            ) {
                appointment.status = 'Completed';
                await appointment.save();
            }
        }

        res.status(200).json({
            message: 'All appointments retrieved successfully',
            appointments: appointments
        });
    } catch (error) {
        console.error("Error fetching appointments:", error);
        res.status(500).json({
            message: 'Internal server error / Failed to retrieve all appointments'
        });
    }
});

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
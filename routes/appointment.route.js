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
        res.status(201).json({message: 'appointment Booked successfully, wait for approval', appointment: appointment});
    } catch (error) {
        res.status(500).json({message: 'Fail to book appointment'})
    }
})

// const isAppointmentCompleted = (appointmentDate, appointmentTime) => {
//     try {
//         // Parse the date in dd-mm-yyyy format
//         const [year, month, day] = appointmentDate.split("-").map(Number);

//         // Parse the time in hh:mm AM/PM format
//         const [time, meridian] = appointmentTime.split(" ");
//         let [hours, minutes] = time.split(":").map(Number);

//         // Convert to 24-hour format
//         if (meridian === "PM" && hours !== 12) {
//             hours += 12;
//         } else if (meridian === "AM" && hours === 12) {
//             hours = 0;
//         }

//         // Construct a valid ISO-compliant date string
//         const formattedDateTime = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}T${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:00.000Z`;
//         // Create a Date object
//         const appointmentDateTime = new Date(formattedDateTime);
 
//         // Get the current date and time
//         const currentDateTime = new Date();
//         // console.log(`current date ${currentDateTime}`)
//         // console.log(`appointment date ${appointmentDateTime}`)

//         // Return true if the appointment is in the past
//         return appointmentDateTime < currentDateTime;
//     } catch (error) {
//         console.error("Error in isAppointmentCompleted:", error);
//         return false;
//     }
// };

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

        // Construct a valid date object in local timezone
        const appointmentDateTime = new Date(year, month - 1, day, hours, minutes);

        // Get the current date and time
        const currentDateTime = new Date();

        // Return true if the appointment is in the past
        return appointmentDateTime < currentDateTime;
    } catch (error) {
        console.error("Error in isAppointmentCompleted:", error);
        return false;
    }
};


// appointmentRouter.get('/all-appointments', async (req, res) => {
//     try {
        

//         // Fetch all appointments with necessary populated fields
//         const appointments = await AppointmentModel.find()
//             .populate('doctorId', '-password')
//             .populate('patientId');

//         const completedAppointments = [];

//         // Classify appointments into completed or expired
//         for (const appointment of appointments) {
//             if (isAppointmentCompleted(appointment.date, appointment.time)) {
//                 if (appointment.status === 'Confirmed') {
//                     completedAppointments.push(appointment._id);
//                 }
//             }
//         }

//         // Perform bulk updates for 'Completed'
//         if (completedAppointments.length > 0) {
//             await AppointmentModel.updateMany(
//                 { _id: { $in: completedAppointments } },
//                 { $set: { status: 'Completed' } }
//             );
//         }

//         res.status(200).json({
//             message: 'All appointments retrieved successfully',
//             appointments: await AppointmentModel.find()
//                 .populate('doctorId', '-password')
//                 .populate('patientId') 
//         });
//     } catch (error) {
//         console.error("Error fetching appointments:", error);
//         res.status(500).json({
//             message: 'Internal server error / Failed to retrieve all appointments'
//         });
//     }
// });

appointmentRouter.get('/all-appointments', async (req, res) => {
    try {
        // Fetch all appointments with necessary populated fields
        const appointments = await AppointmentModel.find()
            .populate('doctorId', '-password')
            .populate('patientId');

        const completedAppointments = [];
        const expiredAppointments = [];

        // Classify appointments into completed or expired
        for (const appointment of appointments) {
            if (isAppointmentCompleted(appointment.date, appointment.time)) {
                if (appointment.status === 'Confirmed') {
                    completedAppointments.push(appointment._id);
                } else if (appointment.status === 'Pending') {
                    expiredAppointments.push(appointment._id);
                }
            }
        }

        // Perform bulk updates for 'Completed' and 'Expired' statuses
        if (completedAppointments.length > 0) {
            await AppointmentModel.updateMany(
                { _id: { $in: completedAppointments } },
                { $set: { status: 'Completed' } }
            );
        }

        if (expiredAppointments.length > 0) {
            await AppointmentModel.updateMany(
                { _id: { $in: expiredAppointments } },
                { $set: { status: 'Expired' } }
            );
        }

        res.status(200).json({
            message: 'All appointments retrieved successfully',
            appointments: await AppointmentModel.find()
                .populate('doctorId', '-password')
                .populate('patientId','-password') // Reload the updated appointments
                .sort({ _id: -1 }) // Sort appointments in descending order by _id (creation time)
        });
    } catch (error) {
        console.error("Error fetching appointments:", error);
        res.status(500).json({
            message: 'Internal server error / Failed to retrieve all appointments'
        });
    }
});

appointmentRouter.get('/selected-doctors-appointments/:doctorId', async(req, res)=>{
    const {doctorId}= req.params;

    try {
        const appointments= await AppointmentModel.find({doctorId});
        res.status(200).json({message: 'particular doctors appointment retrieve successfully', appointments})
    } catch (error) {
        res.status(500).json({message: 'Internal server error'})
    }
})

appointmentRouter.get('/my-appointments',verifyToken, async(req, res)=>{
    const {patientId}= req.body;
    try {
        const appointments= await AppointmentModel.find({patientId}).populate('doctorId', '-password');

        const completedAppointments = [];
        const expiredAppointments = [];

        // Classify appointments into completed or expired automatically as per current time
        for (const appointment of appointments) {
            if (isAppointmentCompleted(appointment.date, appointment.time)) {
                if (appointment.status === 'Confirmed') {
                    completedAppointments.push(appointment._id);
                } else if (appointment.status === 'Pending') {
                    expiredAppointments.push(appointment._id);
                }
            }
        }

        // Perform bulk updates for 'Completed' and 'Expired' statuses
        if (completedAppointments.length > 0) {
            await AppointmentModel.updateMany(
                { _id: { $in: completedAppointments } },
                { $set: { status: 'Completed' } }
            );
        }

        if (expiredAppointments.length > 0) {
            await AppointmentModel.updateMany(
                { _id: { $in: expiredAppointments } },
                { $set: { status: 'Expired' } }
            );
        }

        res.status(200).json({message: 'your appointments get successfully', 
            appointments: await AppointmentModel.find({ patientId })
            .populate('doctorId', '-password')
        })
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
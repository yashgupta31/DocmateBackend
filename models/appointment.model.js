const mongoose= require('mongoose');

const appointmentSchema= new mongoose.Schema({
    doctorId: {type: mongoose.Schema.Types.ObjectId, ref: 'doctor', require: true},
    patientId: {type: mongoose.Schema.Types.ObjectId, ref: 'user', require: true},
    date: {type: String, require: true},
    time: {type: String, require: true},
    fees: {type: Number, require: true},
    status: {type: String, enum: ['Pending', 'Confirmed', 'Cancelled', 'Completed' ], default: 'Pending'},

},
{timestamps: true} // Adds `createdAt` and `updatedAt` fields
)

const AppointmentModel= mongoose.model('appointment', appointmentSchema);

module.exports= AppointmentModel;
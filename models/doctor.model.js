const mongoose= require('mongoose');

const doctorSchema= new mongoose.Schema({
    name: {type: String, require: true},
    image: {type: String, require: true},
    // imageType: {type: String, require: true},
    email: {type: String, require: true, unique: true},
    password: {type: String, require: true},
    fees: {type: Number, require: true},
    speciality: {type: String, require: true},
    experience: {type: Number, require: true},
    address: {type: String, require: true},
    about: {type: String, require: true},
    isAvailable: {type: Boolean, require: true}
})

const DoctorModel= mongoose.model('doctor', doctorSchema);

module.exports=  DoctorModel;
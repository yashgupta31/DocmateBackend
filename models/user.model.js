const mongoose= require('mongoose');

const userSchema= new mongoose.Schema({
    name: {type: String, require: true},
    email: {type: String, require: true, unique: true },
    password: {type: String, require: true},
    role: {type: String, enum: ['patient', 'admin'], require: true},
    image: {type: String},
    phone: {type: Number},
    address: {type: String},
    gender: {type: String},
    DOB: {type: Date}
})

const UserModel= mongoose.model('user', userSchema);

module.exports= UserModel;
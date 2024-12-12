const express= require('express')
const dotenv= require("dotenv")
dotenv.config()
const connection= require('./config/db')
const userRouter= require('./routes/user.route')
const cors= require('cors')
const path = require('path');
const doctorRouter = require('./routes/doctor.route')
const appointmentRouter = require('./routes/appointment.route')

const app= express();
const PORT= process.env.PORT

app.use(express.json())
app.use(cors())
app.use('/user', userRouter)
app.use('/doctor', doctorRouter)
app.use('/appointment', appointmentRouter);
// Serve the "uploads" directory as static
// app.use('/uploads', express.static('uploads'));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.get('/', (req, res)=>{
    res.send('home')
})

app.listen(PORT, async()=>{
    try {
        await connection;
        console.log(`server is running on port- ${PORT}`)
    } catch (error) {
        console.log(error)
    }
    
})


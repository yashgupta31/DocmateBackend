const jwt= require('jsonwebtoken');
const dotenv= require('dotenv')
dotenv.config();

const verifyToken=(req, res, next)=>{
    const token= req.headers.authorization.split(' ')[1];

    if(!token){
        return res.status(401).json({message: 'Access token is missing'});
    }

    try {
        const decoded= jwt.verify(token, process.env.JWT_SECRET);
        req.body.patientId= decoded._id;
        next()
    } catch (error) {
        res.status(403).json({message: 'Invalid or expired token'})
    }
}

module.exports= verifyToken;
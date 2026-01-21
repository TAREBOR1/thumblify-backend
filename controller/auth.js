const User = require("../model/user");
const bcrypt=require('bcryptjs');



exports.signup= async (req,res)=>{
 const {name,email,password}= req.body;
 if(!name||!email||!password){
    return res.status(400).json({
        message:"missing details",
        success:false
    })
 }
 try {
    const existingUser= await User.findOne({email})
    if(existingUser){
       return res.status(400).json({
           message:"user already exist",
           success:false
       })
    }
    const salt= await bcrypt.genSalt(10)
    const hashedpassword= await bcrypt.hash(password,salt)
     const user = new User({
        name,
        password:hashedpassword,
        email
     })

     await user.save()

    //  setting user data in session

    req.session.userId=user._id
    req.session.isLoggedIn=true

    req.session.save(() => { 
        return res.json({
            success: true,
            message: "Account created successfully",
            user: {
                id: user._id,
                name: user.name,
                email: user.email
            }
        });
    });

 } catch (error) {
    res.status(500).json({
        message:error.message,
        success:false
    })
 }
}


exports.login= async(req,res)=>{
    const {email,password}= req.body;
    if(!email||!password){
        return res.status(400).json({
            message:"email and password required",
            success:false
        })
    }
    try {
        const validUser= await User.findOne({email})
        if(!validUser){
            return res.status(400).json({
                message:"User does not exist",
                success:false
            })}
        const validatePassword= await bcrypt.compare(password,validUser.password);
        if(!validatePassword){
            return res.status(400).json({
                message:"invalid password ",
                success:false
            })
        }
    
        req.session.userId=validUser._id
    req.session.isLoggedIn=true

        req.session.save(() => {
  res.json({
    success: true,
    message: "Log in successfully",
    user: {
      id: validUser._id,
      name: validUser.name,
      email: validUser.email,
    },
  });
});
    } catch (error) {
          res.status(500).json({
        message:error.message,
        success:false
    })
}
}

exports.logout =async (req, res) => {
    req.session.destroy((error) => {
        if (error) {
            return res.status(500).json({ message: error.message, success: false });
        }
        res.clearCookie("sessionId",{
        httpOnly: true, // client-side JS cannot access cookie
        secure: process.env.NODE_ENV === 'production', // HTTPS only in prod
        sameSite: process.env.NODE_ENV === 'production'?'none' :'lax',
        maxAge: 24 * 60 * 60 * 1000, // 1 day in ms
        path:'/'


    });
        return res.json({ success: true, message: "Log out successfully" });
    });
};



exports.verifyUser = async (req, res) => {
    try {
        const { userId } = req.session;
        const user = await User.findById(userId).select('-password');
        
        if (!user) {
            return res.status(401).json({
                message: "Unauthorized user",
                success: false
            });
        }
        
        res.json({
            success: true, // Add success field
            user: {
                id: user._id,
                name: user.name,
                email: user.email
            }
        });
    } catch (error) {
        res.status(500).json({
            message: error.message,
            success: false
        });
    }
};

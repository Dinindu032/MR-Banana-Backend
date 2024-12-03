import express from "express";
import bcryt from 'bcrypt';
import User from "../models/User.js";
import jwt from 'jsonwebtoken';
import 'dotenv/config';
import requireAuth from "../middleware/requireAuthor.js";



const router = express.Router();

router.post('/signup', async (req, res) => {
    const { username, email, password } = req.body;
    const user = await User.findOne({email})


    if(user){
        return res.json({message: 'user already existed'});
    }

    const hashpassword = await bcryt.hash(password, 10);
    const newUser = new User({
        username,
        email,
        password: hashpassword,
    })

    await newUser.save();
    return res.json({ status: true, message: "record registed" });

});

router.post('/login', async (req, res) => {
    const { email, password } = req.body;
    const user = await User.findOne({email});
    const validPassword = await bcryt.compare(password, user.password);

    if(!user){
        return res.json({message: 'user is not registered'});
    }

    if(!validPassword){
        return res.json({message: 'password is incorrect'});
    }

    const token = jwt.sign({username: user.username}, process.env.MY_KEY, {expiresIn: '1h'})
    res.cookie('token', token, {httpOnly: true, maxAge: 360000})
    return res.json({status: true, message: 'login successfully',data:JSON.stringify(user)});

});

router.post("/score", requireAuth, async (req, res) => {
    const { bananaScore } = req.body;

    if (bananaScore === undefined || isNaN(bananaScore)) {
        return res.status(400).json({ error: "Invalid banana score value" });
    }

    try {
        const user = await User.findById(req.user._id); // Authenticate user
        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        // Update the user's banana score in the database
        user.bananaScore = parseInt(bananaScore, 10);
        await user.save();

        res.status(200).json({ message: "Banana score updated successfully", bananaScore: user.bananaScore });
    } catch (error) {
        console.error("Error updating banana score:", error);
        res.status(500).json({ error: "Server error" });
    }
});


export default router;
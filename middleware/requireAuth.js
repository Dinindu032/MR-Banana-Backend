import jwt from "jsonwebtoken";
import User from "../models/User.js";

const requireAuth = async (req, res, next) => {
  const { authorization } = req.headers;

  if (!authorization) {
    return res.status(401).json({ error: "Authorization token required" });
  }

  const token = authorization.split(" ")[1];

  try {
    const decodedToken = jwt.verify(token, process.env.MY_KEY);
    const user = await User.findById(decodedToken._id).select("_id");

    if (!user) {
      return res.status(401).json({ error: "Request is not authorized" });
    }

    req.user = user; // Attach user to the request
    next();
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({ error: "Token has expired" });
    }
    console.error(error);
    res.status(401).json({ error: "Request is not authorized" });
  }
};

export default requireAuth;

import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { config } from "./config/config.js";
import * as userModel from "./userModel.js";

export const loginUser = async (username, password) => {
    const user = await userModel.findUserByName(username);

    if (!user) {
        throw new Error("User does not exist");
    }

    const isPasswordValid = password === user.password;
    // const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
        throw new Error("Invalid credentials");
    }

    const token = jwt.sign(
        { id: user.id, email: user.email, group: user.userGroup },
        config.jwtSecret,
        { expiresIn: config.jwtExpiration }
    );

    return {
        token,
        user: {
            id: user.id,
            name: user.username,
            email: user.email,
            group: user.userGroup,
            isActive: user.isActive
        }
    };
};

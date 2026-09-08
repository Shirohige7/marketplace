const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const userRepository = require("../repositories/userRepository");
const { AppError } = require("../utils/errors");

const SALT_ROUNDS = 10;

function signToken(user) {
  return jwt.sign(
    {
      sub: user.id,
      role: user.role,
      vendorId: user.vendor ? user.vendor.id : undefined,
    },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || "1h" }
  );
}

const authService = {
  // role: "BUYER" | "VENDOR". storeName required when role === "VENDOR".
  async register({ email, password, role, storeName }) {
    const existing = await userRepository.findByEmail(email);
    if (existing) throw new AppError("Email already registered", 409);

    if (role === "VENDOR" && !storeName) {
      throw new AppError("storeName is required for vendor accounts", 400);
    }

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
    const user = await userRepository.create({ email, passwordHash, role });

    if (role === "VENDOR") {
      await userRepository.createVendorProfile(user.id, storeName);
    }

    const fullUser = await userRepository.findById(user.id);
    return { user: fullUser, token: signToken(fullUser) };
  },

  async login({ email, password }) {
    const user = await userRepository.findByEmail(email);
    if (!user) throw new AppError("Invalid credentials", 401);

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) throw new AppError("Invalid credentials", 401);

    return { user, token: signToken(user) };
  },
};

module.exports = authService;

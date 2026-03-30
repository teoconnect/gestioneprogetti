import { jwtVerify, SignJWT } from "jose";

const getJwtSecretKey = () => {
  const secret = process.env.JWT_SECRET_KEY;
  if (!secret) {
    return "super-secret-jwt-key-for-development-only";
  }
  return secret;
};

export const verifyAuth = async (token: string) => {
  try {
    const verified = await jwtVerify(
      token,
      new TextEncoder().encode(getJwtSecretKey())
    );
    return verified.payload;
  } catch (error) {
    throw new Error("Your token has expired.");
  }
};

export const createToken = async (username: string) => {
  const token = await new SignJWT({ username })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("24h")
    .sign(new TextEncoder().encode(getJwtSecretKey()));
  return token;
};

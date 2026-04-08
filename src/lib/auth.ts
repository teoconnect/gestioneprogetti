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
    return verified.payload as { id: string; username: string; role: string; iat?: number; exp?: number };
  } catch (error) {
    throw new Error("Your token has expired.");
  }
};

export const createToken = async (id: string, username: string, role: string, expiresIn: string | number | Date = "30d") => {
  const token = await new SignJWT({ id, username, role })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(expiresIn)
    .sign(new TextEncoder().encode(getJwtSecretKey()));
  return token;
};

import { ipKeyGenerator, rateLimit } from "express-rate-limit";

const errorOption = (req, res, next) => {
  const rateLimitError = new Error("Too many attempts. Please try again later.");
  rateLimitError.code = "RATE_LIMITED";

  next(rateLimitError);
};

export const loginIPMiddleware = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 15,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  ipv6Subnet: 56,
  skipSuccessfulRequests: true,
  requestWasSuccessful: (_req, res) => {
    return res.statusCode !== 401;
  },
  handler: errorOption,
});

export const loginEmailMiddleware = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 30,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  ipv6Subnet: 56,
  keyGenerator: (req) => {
    return req.validated.body.email || ipKeyGenerator(req.ip);
  },
  skipSuccessfulRequests: true,
  requestWasSuccessful: (_req, res) => {
    return res.statusCode !== 401;
  },

  handler: errorOption,
});

export const signUpIPMiddleware = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  ipv6Subnet: 56,
  handler: errorOption,
});

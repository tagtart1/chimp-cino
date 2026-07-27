import crypto from "node:crypto";

const secureRandomNumber = (min, max) => {
  return crypto.randomInt(min, max + 1);
};

export default secureRandomNumber;

const crypto = require("crypto");

const secureRandomNumber = (min, max) => {
  const range = max - min + 1;
  const maxByte = 256;
  const maxRange = Math.floor(maxByte / range) * range;

  let randomByte;
  do {
    randomByte = crypto.randomBytes(1)[0];
  } while (randomByte >= maxRange);

  return min + (randomByte % range);
};

module.exports = secureRandomNumber;

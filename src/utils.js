const shuffle = (array) => {
  const copy = new Array(...array);
  return copy.sort((a, b) => 0.5 - Math.random());
};


module.exports = { shuffle };

const errorLogger = (err, req, res, next) => {
  console.error(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  console.error(`Error: ${err.message}`);
  console.error(`Stack: ${err.stack}`);
  next(err); // Pass the error to the next middleware
};

export default errorLogger;
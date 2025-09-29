export default (req, res, next) => {
  if (req.userRole !== "admin") {
    return res.status(403).json({ error: "Apenas administradores podem criar serviços" });
  }
  next();
};
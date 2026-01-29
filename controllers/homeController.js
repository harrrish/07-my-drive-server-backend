export const homeController = async (req, res) => {
  return res.status(200).json({
    success: true,
    message: "Welcome to UVDS-My Drive!",
    developedBy: "Harish S",
    email: "harishs1906@outlook.com",
    contact: "7019412992",
  });
};

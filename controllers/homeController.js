export const homeController = async (req, res) => {
  return res.status(200).json({
    success: true,
    message: "Welcome to UVDS-My Drive!",
    developedBy: "Harish S",
    email: "haridir150@gmail.com",
    contactNumber: "7019412992",
  });
};

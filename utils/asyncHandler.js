export const asyncHandler = (fn) => {
  return async (req, res) => {
    try {
      const result = await fn(req, res);
      return result;
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: "Internal server error !" });
    }
  };
};

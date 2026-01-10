import DirectoryModel from "../models/DirectoryModel.js";

export async function trashDirectoryContents(folderID, foldersList) {
  const foldersFound = await DirectoryModel.find(
    {
      parentFID: folderID,
    },
    { _id: 1 },
  );
  foldersList.push(...foldersFound.map((folder) => folder._id));

  //*===============>  Recursion
  for (const { _id } of foldersFound) {
    await trashDirectoryContents(_id, foldersList);
  }
}

import DirectoryModel from "../models/DirectoryModel.js";

export async function trashDirectoryContents(folderID, subFolderList) {
  const foldersFound = await DirectoryModel.find(
    {
      parentFID: folderID,
    },
    { _id: 1 },
  );
  subFolderList.push(...foldersFound.map((folder) => folder._id));

  //*===============>  Recursion
  for (const { _id } of foldersFound) {
    await trashDirectoryContents(_id, subFolderList);
  }
}

// console.error(error);

import "dotenv/config";
import mongoose from "mongoose";
import Handout from "../src/models/handoutModel.js";

const MAP = {
  golpo: "story",
  itihash: "history",
  dharmiyo: "religious",
  ovizoggota: "experience",
  onnanno: "other",
  kobita: "other", // kobita বাদ গেছে, তাই এগুলো other এ যাবে
};

await mongoose.connect(process.env.MONGO_URI);

for (const [oldKey, newKey] of Object.entries(MAP)) {
  // collection দিয়ে সরাসরি, যাতে নতুন enum validation বাধা না দেয়
  const r = await Handout.collection.updateMany(
    { category: oldKey },
    { $set: { category: newKey } },
  );
  console.log(`${oldKey} -> ${newKey}: ${r.modifiedCount} টা`);
}

await mongoose.disconnect();
console.log("শেষ");

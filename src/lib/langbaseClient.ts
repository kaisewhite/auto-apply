import "dotenv/config";
import { Langbase } from "langbase";

if (!process.env.LANGBASE_API_KEY) {
  throw new Error("Missing Langbase API Key. Please set LANGBASE_API_KEY in your .env file.");
}

export const langbaseClient = new Langbase({
  apiKey: process.env.LANGBASE_API_KEY,
});

console.log("Langbase client initialized."); // Optional: Log initialization

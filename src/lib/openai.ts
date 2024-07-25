import exp from "constants";
import OpenAI
from "openai";


export const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
}
)
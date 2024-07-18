import {HfInference} from '@huggingface/inference'

export const huggingfaceApi = new HfInference(process.env.HUGGINGFACE_API_KEY)


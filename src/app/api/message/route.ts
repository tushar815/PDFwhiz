import { db } from "@/db";
import { huggingfaceApi } from "@/lib/huggingFace";
import { pinecone } from "@/lib/pinecone";
import { SendMessageValidator } from "@/lib/validators/SendMessageValidator";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import { HuggingFaceInferenceEmbeddings } from "@langchain/community/embeddings/hf";
import { PineconeStore } from "@langchain/pinecone";
import { NextRequest } from "next/server";
import Anthropic from '@anthropic-ai/sdk';
import {HuggingFaceStream, StreamingTextResponse, AnthropicStream} from 'ai'
import openai from "openai";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || '',
});

export const POST = async (req: NextRequest) => {
  const body = await req.json();
  const { getUser } = getKindeServerSession();
  const user = await getUser();

  const { id: userId } = user;

  if (!userId) return new Response("Unauthorized", { status: 401 });

  const {fileId, message} = SendMessageValidator.parse(body)

  const file = await db.file.findFirst({
    where: {
        id: fileId,
        userId,
    }
  })

  if(!file) return new Response("Not Found", { status: 404 });

  await db.message.create({
    data: {
      text: message,
      isUserMessage: true,
      userId,
      fileId
    }
  })

  ///create vector message
  const embeddings = new HuggingFaceInferenceEmbeddings({
    apiKey: process.env.HUGGINGFACE_API_KEY!,
  });
  const pineconeIndex = pinecone.index("pdfwhiz");
  const vectorStore = await PineconeStore.fromExistingIndex(embeddings, {
    pineconeIndex,
    namespace: file.id
  })


  console.log("IN VECTORRRR", vectorStore);
  
  const results = await vectorStore.similaritySearch(message, 4)

  const prevMessage = await db.message.findMany({
    where: {
      fileId
    },
    orderBy: {
      createdAt: "asc"
    },
    take: 4
  })

  const formattedMessages = prevMessage.map((msg)=> ({
    role: msg.isUserMessage ? "user" as const: "assistant" as const,
    content: msg.text
  }))

  const response = await anthropic.messages.create({
    messages: [
      {
        role: 'system',
        content:
          'Use the following pieces of context (or previous conversaton if needed) to answer the users question in markdown format.',
      },
      {
        role: 'user',
        content: `Use the following pieces of context (or previous conversaton if needed) to answer the users question in markdown format. \nIf you don't know the answer, just say that you don't know, don't try to make up an answer.
        
  \n----------------\n
  
  PREVIOUS CONVERSATION:
  ${formattedMessages.map((message) => {
    if (message.role === 'user') return `User: ${message.content}\n`
    return `Assistant: ${message.content}\n`
  })}
  
  \n----------------\n
  
  CONTEXT:
  ${results.map((r) => r.pageContent).join('\n\n')}
  
  USER INPUT: ${message}`,
      },
    ],
    model: 'claude-3-haiku-20240307',
    stream: true,
    max_tokens: 300,
  });



















let response1 = ''
let streamData = ''
for await( const chunk of huggingfaceApi.chatCompletionStream({
  model:'mistralai/Mistral-7B-Instruct-v0.2',
  messages: [
    {
      role: 'system',
      content:
        'Use the following pieces of context (or previous conversaton if needed) to answer the users question in markdown format.',
    },
    {
      role: 'user',
      content: `Use the following pieces of context (or previous conversaton if needed) to answer the users question in markdown format. \nIf you don't know the answer, just say that you don't know, don't try to make up an answer.
      
\n----------------\n

PREVIOUS CONVERSATION:
${formattedMessages.map((message) => {
  if (message.role === 'user') return `User: ${message.content}\n`
  return `Assistant: ${message.content}\n`
})}

\n----------------\n

CONTEXT:
${results.map((r) => r.pageContent).join('\n\n')}

USER INPUT: ${message}`,
    },
  ],
  max_tokens: 500,
  temperature: 0.1,
  seed: 0,
})) {

  console.log(`Datttttttttttttta:::::', ${chunk.choices[0].delta.content}`);
  
  if (chunk.choices && chunk.choices.length > 0) {
      let data = chunk.choices[0].delta.content
    streamData = new HuggingFaceStream(data

  }
}

  // const response =  huggingfaceApi.textGenerationStream({
  //   model: "OpenAssistant/oasst-sft-4-pythia-12b-epoch-3.5'",
  //   temperature: 0,
  //   stream: true,
  //   messages: [
  //     {
  //       role: 'system',
  //       content:
  //         'Use the following pieces of context (or previous conversaton if needed) to answer the users question in markdown format.',
  //     },
  //     {
  //       role: 'user',
  //       content: `Use the following pieces of context (or previous conversaton if needed) to answer the users question in markdown format. \nIf you don't know the answer, just say that you don't know, don't try to make up an answer.
        
  // \n----------------\n
  
  // PREVIOUS CONVERSATION:
  // ${formattedMessages.map((message) => {
  //   if (message.role === 'user') return `User: ${message.content}\n`
  //   return `Assistant: ${message.content}\n`
  // })}
  
  // \n----------------\n
  
  // CONTEXT:
  // ${results.map((r) => r.pageContent).join('\n\n')}
  
  // USER INPUT: ${message}`,
  //     },
  //   ],

  // })

  // console.log('REsponssssee', response);
  

const stream = AnthropicStream(response3);

console.log('Steammmmmmmmmmmmm', stream);

return new StreamingTextResponse(stream);

};

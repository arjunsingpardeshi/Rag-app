import { OpenAIEmbeddings } from "@langchain/openai";
import { QdrantVectorStore } from "@langchain/qdrant";
import OpenAi from "openai"

const client = new OpenAi({apiKey: process.env.OPENAI_API_KEY})
export async function POST(req){

    const body = await req.json()
    const userQuery = body.message;
    console.log("user query = ", userQuery)

    const embeddings = new OpenAIEmbeddings({
         model: "text-embedding-3-large"
    });

    const vectorStore = await QdrantVectorStore.fromExistingCollection(
        embeddings,
        {   url:process.env.QDRANT_URL,
            apiKey:process.env.QDRANT_API_KEY,
            collectionName: 'rag-collection'
        }
    );

    const vectorSearcher = vectorStore.asRetriever({
        k: 3
    })

    const releventChunks = vectorSearcher.invoke(userQuery)

    const SYSTEM_PROMPT =   `You are an AI Assistant who help in resolving
     user query based on context availble to you from PDF file with content and page number.
     
     Only ans based on the available context from f=file only
     
     Context:
     ${JSON.stringify(releventChunks)}
     `

     
    const response = await client.chat.completions.create({
        model: 'gpt-4.1-mini',
        messages: [
            {role:'system', content: SYSTEM_PROMPT},
            {role:'user', content: userQuery}
        ]
    })

    return new Response(JSON.stringify({reply: response.choices[0].message.content}), {status:200})
}
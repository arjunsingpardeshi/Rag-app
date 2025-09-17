import { OpenAIEmbeddings } from "@langchain/openai";
import { QdrantVectorStore } from "@langchain/qdrant";
import OpenAi from "openai"

const client = new OpenAi({apiKey: process.env.OPENAI_API_KEY})
export async function POST(req){

    try {

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
    
        const releventChunks = await vectorSearcher.invoke(userQuery)
    
        const SYSTEM_PROMPT =   `You are an AI Assistant who help in resolving
         user query based on context availble to you from PDF file with content and page number.
         
         Only ans based on the available context from file only
         
         Context:
         ${JSON.stringify(releventChunks)}
         `
    
         
        const response = await client.chat.completions.create({
            model: 'gpt-4.1-mini',
            messages: [
                {role:'system', content: SYSTEM_PROMPT},
                {role:'user', content: userQuery}
            ],
            stream: true,
        })

        const encoder = new TextEncoder();
        const decoder = new TextDecoder()

        const readableStream = new ReadableStream({
            async start(controller){
                try {
                    for await(const chunk of response) {
                        const token = chunk.choices[0].delta.content || "";
                        if(token){
                            controller.enqueue(encoder.encode(token))
                        }
                    }
                } catch (err) {
                    controller.error(err)
                }finally{
                    controller.close()
                }
            },
        });


       // console.log("message from retrival is ", response.choices[0].message.content)
        return new Response(readableStream, {
            headers: {
                "Content-Type": "text/plain; charset=utf-8"
            }
        })
    } catch (error) {
        console.log("error in retrival is = ", error)
        return new Response(JSON.stringify({error: error.message}), {status:500})
    }
}
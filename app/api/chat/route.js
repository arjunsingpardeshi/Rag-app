import { OpenAIEmbeddings } from "@langchain/openai";
import { QdrantVectorStore } from "@langchain/qdrant";
import OpenAi from "openai"
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({});
const client = new OpenAi({apiKey: process.env.OPENAI_API_KEY})
export async function POST(req){

    try {

        const body = await req.json()
        const userQuery = body.message;
        console.log("user query = ", userQuery)
        const QUERY_OPTIMIZE_SYSTEM_PROMPT = `You are user qury optimizer. you take user query and optimize user query into clear, concise
        and well structure form that preserve original meaning. remove unneccessary word, fix grammer and make it suitable for serach or retrival.
        Do NOT answer the query. Output ONLY the optimized query, nothing else. `;
        const res = await ai.models.generateContent({
                model: "gemini-2.5-flash",
                contents: userQuery,
                config: {
                    systemInstruction: QUERY_OPTIMIZE_SYSTEM_PROMPT
                }
        });
        const optimizeQuery = res.text
        console.log("optimize query = ", optimizeQuery);
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
    
        const releventChunks = await vectorSearcher.invoke(optimizeQuery)
    
        const SYSTEM_PROMPT =   `You are an AI Assistant who help in resolving
         user query based on context available.the context may come from raw text, PDF (with page numbers)
         or website document (with URLs)
         
         Rules:
         
         - Use only available context to answer. Do NOT use outside knowledge.
         - If the context is from PDF then mention gtha page number in answer as refereces.
         - If the context is from website document, provide URL of the source.
         - If multiple data source is provided then give answer according to only from that data source.
         - If some data source is missing then give response according to only available data source.
         - If the answer is cannot be found in the available context, then give response 
            "this question is out of context. Please ask question only related to provided context. "
         - keep answer clear, concise and related to query.
         
         Context:
         ${JSON.stringify(releventChunks)}
         `
    
    
        const response = await client.chat.completions.create({
            model: 'gpt-4.1-mini',
            messages: [
                {role:'system', content: SYSTEM_PROMPT},
                {role:'user', content: optimizeQuery}
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
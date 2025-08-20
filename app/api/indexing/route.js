import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { OpenAIEmbeddings } from "@langchain/openai";
import { QdrantVectorStore } from "@langchain/qdrant";

//import {QdrantClient} from '@qdrant/js-client-rest';

export async function  POST(req) {
    

    try{
        console.log("req in indexing", req)

        const body = await req.json();
        const pdfFilePath = body.filePath;
        console.log("file path", pdfFilePath)

        const loader = new PDFLoader(pdfFilePath)
        const docs = await loader.load()

        const embeddings = new OpenAIEmbeddings({
        model: "text-embedding-3-large"
        });

        
        const vectorStore = await QdrantVectorStore.fromDocuments(docs, embeddings,{
            url:process.env.QDRANT_URL,
            apiKey:process.env.QDRANT_API_KEY,
            collectionName: 'rag-collection'
        })
        console.log("indexing of document done...")
        return new Response(JSON.stringify({success: true}), {status:200})
    }
    catch(err){
        console.log("error in indexing while geting filpath", err)
        return new Response(JSON.stringify({error:err.message}), {status:500})
    }
    // const client = new QdrantClient({
    // url: process.env.QDRANT_URL,
    // apiKey: process.env.QDRANT_API_KEY
    // });

    // try {
    //  const result = await client.getCollections();
    //  console.log('List of collections:', result.collections);
    // } catch (err) {
    //  console.error('Could not get collections:', err);
    // }
}
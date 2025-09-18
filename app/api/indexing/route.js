import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { OpenAIEmbeddings } from "@langchain/openai";
import { QdrantVectorStore } from "@langchain/qdrant";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter"
import {CheerioWebBaseLoader} from "@langchain/community/document_loaders/web/cheerio"
//import {TextLoader} from "langchain/community/document_loaders/fs/text"
import path from "path";

//import {QdrantClient} from '@qdrant/js-client-rest';

export async function  POST(req) {
    

    try{
       // console.log("req in indexing", req)

        const body = await req.json();
        
        const { type, filePath, text, textName, url } = body;
        console.log("type = ",type)
        console.log("filepath = ",filePath)
        console.log("text = ",text)
        console.log("textName = ", textName)
        console.log("url = ",url)
        //const pdfFilePath = body.filePath;
        //console.log("file path", pdfFilePath)
        if(type === "pdf")
        {
            const loader = new PDFLoader(filePath);
            const docs = await loader.load();
            const fileName = path.basename(filePath);

            console.log("file name", fileName)
            docs.forEach((doc) => doc.metadata.source = fileName)
            const embeddings = new OpenAIEmbeddings({
            model: "text-embedding-3-large"
            });

            
            const vectorStore = await QdrantVectorStore.fromDocuments(docs, embeddings,{
                url:process.env.QDRANT_URL,
                apiKey:process.env.QDRANT_API_KEY,
                collectionName: 'rag-collection'
            })
            console.log("indexing of PDF document done...")
            return new Response(JSON.stringify({success: true}), {status:200})
        }
        // const loader = new PDFLoader(pdfFilePath)
        // const docs = await loader.load()
        // const fileName = path.basename(pdfFilePath)
        else if(type === "rawText"){
        
            //split raw string
            console.log("inside text")
            const splitter = new RecursiveCharacterTextSplitter({
                chunkSize: 50,
                chunkOverlap: 10
            })
            const docs = await splitter.createDocuments([text]);
            const fileName = textName;
            console.log("file name", fileName)

            docs.forEach((doc) => doc.metadata.source = fileName)
            const embeddings = new OpenAIEmbeddings({
            model: "text-embedding-3-large"
            });

            
            const vectorStore = await QdrantVectorStore.fromDocuments(docs, embeddings,{
                url:process.env.QDRANT_URL,
                apiKey:process.env.QDRANT_API_KEY,
                collectionName: 'rag-collection'
            })
            console.log("indexing of row text is done...")
            return new Response(JSON.stringify({success: true}), {status:200})
        }

        
        else if(type==="link") {

            const loader = new CheerioWebBaseLoader(url);
            
            const docs = await loader.load();
            const fileName = url;

            console.log("file name", fileName)

            docs.forEach((doc) => doc.metadata.source = fileName)
            const embeddings = new OpenAIEmbeddings({
            model: "text-embedding-3-large"
            });

            
            const vectorStore = await QdrantVectorStore.fromDocuments(docs, embeddings,{
                url:process.env.QDRANT_URL,
                apiKey:process.env.QDRANT_API_KEY,
                collectionName: 'rag-collection'
            })
            console.log("indexing of row text is done...")
            return new Response(JSON.stringify({success: true}), {status:200})
        }


        else {
            return new Response(JSON.stringify({ 
                error: `Invalid type: ${type}. Expected "pdf", "rawText", or "link".` 
            }), { status: 400 })
        }
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
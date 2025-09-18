import {QdrantClient} from "@qdrant/js-client-rest"

const client = new QdrantClient({
    url: process.env.QDRANT_URL,
    apiKey: process.env.QDRANT_API_KEY
})
// console.log("url = ", process.env.QDRANT_URL)
// console.log("apikey = ", process.env.QDRANT_API_KEY)
export async function DELETE(req){
    try {
        const body = await req.json();
        const {sourceName} = body;
        if(!sourceName){
            return new Response(JSON.stringify({error: "source name is required"}), {status:400})
        }

        await client.delete("rag-collection", {
            filter: {
              must: [
                {key: "source", match: {value:sourceName}}
              ]
            }
        })
        
        return new Response(JSON.stringify({message: `Deleted data for source ${sourceName}`}), {status: 200})
    } catch (error) {
        console.log("error in deleting data ", error)
        return new Response(JSON.stringify({error: `error in deleting data  ${error.message}`}), {status: 500})
    }
}
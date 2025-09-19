import {QdrantClient} from "@qdrant/js-client-rest"

const client = new QdrantClient({
    url: process.env.QDRANT_URL,
    apiKey: process.env.QDRANT_API_KEY,
    checkCompatibility: false
})
// console.log("url = ", process.env.QDRANT_URL)
// console.log("apikey = ", process.env.QDRANT_API_KEY)
export async function DELETE(req){
    try {

    
    //   const pointId = "5678ada7-b037-48f4-a195-406efcf8d746";

    // const res = await client.delete("rag-collection", {
    //   points: [pointId], // ✅ delete by ID
    //   wait: true,
    // });
    //console.log("res delete = ", res)
        console.log("delete api is call")
        const body = await req.json();
        const {sourceName} = body;
        if(!sourceName){
            return new Response(JSON.stringify({error: "source name is required"}), {status:400})
        }

        await ensureIndex("rag-collection", "metadata.source", "keyword")
        const test = await client.scroll("rag-collection", { limit: 1 });
        console.log(JSON.stringify(test, null, 2));

  
// const found = await client.scroll("rag-collection", {
//   filter: {
//     must: [
//       { key: "metadata.source", match: { value: sourceName } }
//     ],
//   },
//   limit: 5,
// });
// console.log("Found points:", found);

        const response =  await client.delete("rag-collection", {
            filter: {
              must: [
                {key: "metadata.source", match: {value:sourceName}}
              ]
            },
            wait: true
        })
        
        return new Response(JSON.stringify({message: `Deleted data for source ${sourceName}`, response}), {status: 200})
    } catch (error) {
        console.log("error in deleting data ", error)
        return new Response(JSON.stringify({error: `error in deleting data  ${error.message}`}), {status: 500})
    }
}




async function ensureIndex(collectionName, fieldName, schemaType = "keyword") {
  try {
    const colInfo = await client.getCollection(collectionName);

    // payload_schema may not exist if no payload has been inserted yet
    const payloadSchema = colInfo.result?.payload_schema ?? {};

    const existingField = payloadSchema[fieldName];

    if (existingField && existingField.data_type === schemaType) {
      console.log(`✅ Index exists for field ${fieldName}`);
    } else {
      console.log(`⚠️ Index missing for field ${fieldName}, creating...`);
      await client.createPayloadIndex(collectionName, {
        field_name: fieldName,
        field_schema: schemaType,
      });
      console.log(`✅ Created index for field ${fieldName}`);
    }
  } catch (err) {
    console.error("Error ensuring index:", err);
    throw err;
  }
}

// // Example usage (e.g. at server startup)
// (async () => {
//   await ensureIndexes("rag-collection");
// })();

// async function getPointIdsBySource(sourceName) {
//   let ids = [];
//   let offset = null;

//   while (true) {
//     const res = await client.scroll("rag-collection", {
//       filter: {
//         must: [
//           {
//             key: "metadata.source",
//             match: { value: sourceName },
//           },
//         ],
//       },
//       offset,
//       limit: 100, // fetch in chunks
//       with_payload: true,
//     });

//     const { points, next_page_offset } = res;

//     // collect all ids
//     ids.push(...points.map((p) => p.id));

//     if (!next_page_offset) break; // no more pages
//     offset = next_page_offset;
//   }

//   return ids;
// }
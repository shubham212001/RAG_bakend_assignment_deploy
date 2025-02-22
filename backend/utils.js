const wcdUrl = "https://pb6xhm5yqgeaqs9emzh50a.c0.asia-southeast1.gcp.weaviate.cloud";
const wcdApiKey = "KCRLUplD5ObGzO9HghwkfIFdchSzeESnfxCT";
const openAiKey = "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" || '';

const client = await weaviate.connectToWeaviateCloud(wcdUrl, {
    authCredentials: new weaviate.ApiKey(wcdApiKey),
    grpcHost: wcdUrl, // Set gRPC host explicitly
    secure: false,
    headers: {
      'X-OpenAI-Api-Key': openAiKey,  // Replace with your inference API key
    }
  });

  export default client;
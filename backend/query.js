import client from "./utils";
async function fetchAndFilterByDocumentId(query, documentId) {
    const collection = client.collections.get('Test_working_final')

    try {
      // Perform the nearText query with the provided query string
      const dataRetrievalResult = await collection.query.nearText(
        [query],  
        {
          returnProperties: ['page_content', 'document_id'],
          limit: 3,
        }
      );
  
      // Check if objects are present in the response
      if (!dataRetrievalResult || !dataRetrievalResult.objects) {
        console.error('No objects found in the data retrieval result.');
        return null;
      }
  
      // Filter results to include only those with the specified documentId
      const filteredResults = dataRetrievalResult.objects.filter(
        (item) => item.properties && item.properties.document_id === documentId
      );
  
      // Merge the page_content of the filtered results
      const mergedContent = filteredResults
        .map((item) => item.properties.page_content)
        .join('\n\n'); // Joining with two newlines for readability
  
      return mergedContent;
    } catch (error) {
      console.error('Error fetching and filtering data:', error);
      return null;
    }
  }

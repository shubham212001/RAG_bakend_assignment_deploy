try {
    const documentCollection = client.collections.get('Json_data');

    // Check if the collection exists
    if (!documentCollection) {
        console.warn("Collection 'Json_data' not found. Skipping deletion step.");
    } else {
        // Check if the filename already exists in the collection
        const result = await documentCollection.query.fetchObjects({
            filters: documentCollection.filter.byProperty('file_name').equal(req.file.originalname),
            limit: 1, // Limit to 1 since we just need to check if data exists
        });

        let data_found = result.objects.length > 0 ? 1 : 0;

        if (data_found) {
            console.log(`Data found for filename: ${req.file.originalname}`);

            try {
                // Deleting the data
                const response = await documentCollection.data.deleteMany(
                    documentCollection.filter.byProperty('file_name').equal(req.file.originalname)
                );
                console.log(`Deleted already existing objects for filename: ${req.file.originalname}`);
            } catch (deleteError) {
                console.error("Error deleting existing objects:", deleteError);
                throw new Error("Failed to delete existing data before insertion.");
            }
        }
    }

    // Continue with further code execution
    console.log("Proceeding with the next steps...");
} catch (error) {
    console.error("Error processing Weaviate JSON storage:", error);
    throw new Error("Weaviate query operation failed.");
}
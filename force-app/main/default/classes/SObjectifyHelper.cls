public inherited sharing class SObjectifyHelper {

    public static MetadataDependencyToolingResponse getMetadataDependecies(List<string> fieldIds){
        try {
            List<String> idsWithSingleQuotes = new List<String>();
            for(String fieldId : fieldIds){
                idsWithSingleQuotes.add('\'' + fieldId + '\'');
            }
            String query = 'SELECT MetadataComponentName, MetadataComponentType, RefMetadataComponentId FROM MetadataComponentDependency WHERE RefMetadataComponentId IN (' + String.join(idsWithSingleQuotes, ',') + ')';
            HttpResponse response = ToolingAPIUtility.queryToolingAPI(query);
            return (MetadataDependencyToolingResponse) JSON.deserializeStrict(response.getBody(), MetadataDependencyToolingResponse.class);
        } catch (Exception e) {
            throw new AuraHandledException(e.getMessage());
        }
    }
}
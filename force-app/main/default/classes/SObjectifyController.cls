public with sharing class SObjectifyController {

    private static final String CUSTOM_EXTENSION = '__c';

    public class SObjectInterface {
        @AuraEnabled
        public String label { get; set; }
        @AuraEnabled
        public String value { get; set; }
        
        public SObjectInterface(String label, String value) {
            this.label = label;
            this.value = value;
        }
    }

    public class FieldReferencesInfo {
        @AuraEnabled
        public String componentName { get; set; }
        @AuraEnabled
        public String componentType { get; set; }
    
        public FieldReferencesInfo(String name, String type) {
            this.componentName = name;
            this.componentType = type;
        }
    }

    @AuraEnabled(cacheable=true)
    public static List<SObjectInterface> getAllSObjects() {
        List<SObjectInterface> sobjectList = new List<SObjectInterface>();
        
        Map<String, Schema.SObjectType> globalDescribe = Schema.getGlobalDescribe();
        for (String sObjectName : globalDescribe.keySet()) {
            Schema.DescribeSObjectResult sObjectTypeResult = globalDescribe.get(sObjectName).getDescribe();
            
            if(sObjectTypeResult.isAccessible() && !sObjectTypeResult.isDeprecatedAndHidden() && sObjectTypeResult.isDeletable()){
                SObjectInterface sSObjectInfo = new SObjectInterface(sObjectTypeResult.getLabel() + ' - (' + sObjectTypeResult.getName() + ')', sObjectTypeResult.getName());
                sobjectList.add(sSObjectInfo);
            }
        }
        
        return sobjectList;
    }

    @AuraEnabled(cacheable=true)
    public static Map<string, integer> getSObjectMetadataCountInfo(string sObjectName){
        Map<string, integer> sobjectInfoMap = new Map<string, integer>();
        try {
            SObjectInfo thisInfo = SObjectInfo.getInstance(sObjectName);
            sobjectInfoMap = thisInfo.getMetadataCountInfo();
        } catch (Exception e) {
            throw new AuraHandledException(e.getMessage());
        }
        return sobjectInfoMap;
    }

    @AuraEnabled(cacheable=true)
    public static string getCustomSObjectId(string sObjectName){
        SObjectInfo objectInfo = SObjectInfo.getInstance(sObjectName);
        return objectInfo.getCustomObjectId();
    }

    @AuraEnabled(cacheable=true)
    public static List<Object> getSObjectMetadataInfo(String sObjectName, String infoType) {
        SObjectInfo objectInfo = SObjectInfo.getInstance(sObjectName);
        
        // Determine what type of info to return based on the infoType string
        if (infoType == 'Fields') {
            return objectInfo.getFields();
        } else if (infoType == 'Page Layouts') {
            return objectInfo.getLayouts();
        } else if (infoType == 'Record Types') {
            return objectInfo.getRecordTypes();
        } else {
            throw new IllegalArgumentException('Invalid infoType: ' + infoType);
        }
    }

    @AuraEnabled
    public static List<FieldReferencesInfo> getFieldReferences(String fieldId){
        List<FieldReferencesInfo> fieldRefs = new List<FieldReferencesInfo>();
        String query = 'SELECT MetadataComponentName, MetadataComponentType FROM MetadataComponentDependency WHERE RefMetadataComponentId = \'' + fieldId + '\'';
        HttpResponse response = ToolingAPIUtility.queryToolingAPI(query);
        MetadataDependencyToolingResponse toolingRes = (MetadataDependencyToolingResponse) JSON.deserializeStrict(response.getBody(), MetadataDependencyToolingResponse.class);
        if(toolingRes.size > 0){
            for(MetadataDependencyToolingResponse.Record rec : toolingRes.records){
                fieldRefs.add(new FieldReferencesInfo(rec.MetadataComponentName, rec.MetadataComponentType));
            }
        }
        return fieldRefs;
    }

    @AuraEnabled
    public static List<String> getUnusedFields(List<String> customFieldIds){
        try {
            List<String> modifiedIds = new List<String>();
            Set<String> fieldIdsWithReferences = new Set<String>();
            for(String customFieldId : customFieldIds){
                modifiedIds.add('\'' + customFieldId + '\'');
            }
            String query = 'SELECT MetadataComponentName, MetadataComponentType, RefMetadataComponentId FROM MetadataComponentDependency WHERE RefMetadataComponentId IN (' + String.join(modifiedIds, ',') + ')';
            HttpResponse response = ToolingAPIUtility.queryToolingAPI(query);
            MetadataDependencyToolingResponse toolingRes = (MetadataDependencyToolingResponse) JSON.deserializeStrict(response.getBody(), MetadataDependencyToolingResponse.class);
            if(toolingRes.size > 0){
                for(MetadataDependencyToolingResponse.Record rec : toolingRes.records){
                    fieldIdsWithReferences.add(rec.RefMetadataComponentId);
                }
            }

            Set<String> unusedFields = new Set<String>(customFieldIds);
            unusedFields.removeAll(fieldIdsWithReferences);
            return new List<String>(unusedFields);

        } catch (Exception e) {
            throw new AuraHandledException(e.getMessage());
        }
    }
}


public with sharing class MetaNerdController {

    public class SObjectInfo {
        @AuraEnabled
        public String label { get; set; }
        @AuraEnabled
        public String value { get; set; }
        
        public SObjectInfo(String label, String value) {
            this.label = label;
            this.value = value;
        }
    }

    public class FieldInfo {
        @AuraEnabled
        public Id fieldId { get; set; }
        @AuraEnabled
        public String apiName { get; set; }
        @AuraEnabled
        public String label { get; set; }
        @AuraEnabled
        public Boolean isCustom { get; set; }
        
        public FieldInfo(String apiName, String label, Boolean isCustom) {
            this.apiName = apiName;
            this.label = label;
            this.isCustom = isCustom;
        }

        public void setFieldId(Id fieldId){
            this.fieldId = fieldId;
        }
    }

    public class FieldReferencesInfo {
        @AuraEnabled
        public String fieldId { get; set; }
        @AuraEnabled
        public Boolean hasReferences { get; set; }
        @AuraEnabled
        public List<String> fieldReferences { get; set; }
    }
    
    @AuraEnabled(cacheable=true)
    public static List<SObjectInfo> getSObjectInfo() {
        List<SObjectInfo> sobjectList = new List<SObjectInfo>();
        
        Map<String, Schema.SObjectType> globalDescribe = Schema.getGlobalDescribe();
        for (String sObjectName : globalDescribe.keySet()) {
            Schema.DescribeSObjectResult sObjectTypeResult = globalDescribe.get(sObjectName).getDescribe();
            String apiName = sObjectTypeResult.getName();
            String label = sObjectTypeResult.getLabel();
            
            if(sObjectTypeResult.isAccessible() && !sObjectTypeResult.isDeprecatedAndHidden() && sObjectTypeResult.isDeletable()){
                SObjectInfo sSObjectInfo = new SObjectInfo(label + ' - (' + apiName + ')', apiName);
                sobjectList.add(sSObjectInfo);
            }
        }
        
        return sobjectList;
    }

    @AuraEnabled(cacheable=true)
    public static List<FieldInfo> getFieldInfo(String sObjectName) {
        Map<String, FieldInfo> fieldMapByDeveloperName = new Map<String, FieldInfo>();
        
        Schema.SObjectType sObjectType = Schema.getGlobalDescribe().get(sObjectName);
        if (sObjectType != null) {
            Schema.DescribeSObjectResult describeResult = sObjectType.getDescribe();
            Map<String, Schema.SObjectField> fieldMap = describeResult.fields.getMap();
            
            for (String fieldName : fieldMap.keySet()) {
                Schema.DescribeFieldResult field = fieldMap.get(fieldName).getDescribe();
                String apiName = field.getName();
                String label = field.getLabel();
                Boolean isCustom = field.isCustom();
                
                //Add to field info
                FieldInfo fieldInfo = new FieldInfo(apiName, label, isCustom);
                fieldMapByDeveloperName.put(apiName, fieldInfo);
            }

            //Query the field definition tooling api
            Map<String,String> apiNamesWithUnderscoreByWithoutUnderscore = new Map<String, String>();
            for(String apiName : fieldMapByDeveloperName.keySet()){
                apiNamesWithUnderscoreByWithoutUnderscore.put(apiName.contains('__c') ? apiName.replace('__c', '') : apiName, apiName);
            }
            String query = getCustomFieldIds(sObjectName);
            system.debug('Query::'+query);
            HttpResponse response = ToolingAPIUtility.queryToolingAPI(query);
            System.debug(response.getBody());
            CustomFieldToolingResponse toolingRes = (CustomFieldToolingResponse) JSON.deserializeStrict(response.getBody(), CustomFieldToolingResponse.class);
            if(toolingRes.size > 0 && toolingRes.records.size() > 0){
                for (CustomFieldToolingResponse.Record rec : toolingRes.records) {
                    if(fieldMapByDeveloperName.containsKey(apiNamesWithUnderscoreByWithoutUnderscore.get(rec.DeveloperName))){
                        FieldInfo currentFieldInfo = fieldMapByDeveloperName.get(apiNamesWithUnderscoreByWithoutUnderscore.get(rec.DeveloperName));
                        currentFieldInfo.fieldId = rec.Id;
                        fieldMapByDeveloperName.put(apiNamesWithUnderscoreByWithoutUnderscore.get(rec.DeveloperName), currentFieldInfo);
                    }
                }
            }

        }
        
        return fieldMapByDeveloperName.values();
    }

    private static string getCustomFieldIds(string sobjectName){
        return 'SELECT Id, DeveloperName from CustomField WHERE TableEnumOrId = \'' + sObjectName + '\'';
    }

    private static Map<String, FieldReferencesInfo> extractFieldReferencesFromJSON(String jsonOutput){
        //Fiele reference map => i.e. 'refComponentName', 'Layout-Account Layout, ...'
        Map<String, FieldReferencesInfo> fieldReferenceMap = new Map<String, FieldReferencesInfo>();
        return fieldReferenceMap;
    }

    @AuraEnabled
    public static List<Id> getFieldsReferences(List<Id> fieldIds){
        String fieldIdsString = '';
        for(String fieldId : fieldIds){
            fieldIdsString += '\'' + fieldId + '\',';
        }
        fieldIdsString = fieldIdsString.removeEnd(',');
        String query = 'SELECT RefMetadataComponentId FROM MetadataComponentDependency WHERE RefMetadataComponentId IN (' + fieldIdsString + ')';
        HttpResponse response = ToolingAPIUtility.queryToolingAPI(query);
        System.debug(response.getBody());
        MetadataDependencyToolingResponse toolingRes = (MetadataDependencyToolingResponse) JSON.deserializeStrict(response.getBody(), MetadataDependencyToolingResponse.class);
        if(toolingRes.size > 0 && toolingRes.records.size() > 0){
            Set<Id> refComponentIds = new Set<Id>();
            for(MetadataDependencyToolingResponse.Record rec : toolingRes.records){
                Integer fieldIndex = fieldIds.indexOf(rec.RefMetadataComponentId);
                if(fieldIndex > 0){
                    fieldIds.remove(fieldIndex);
                }
            }
        }
        return fieldIds;
    }
}
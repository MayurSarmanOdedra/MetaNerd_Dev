public with sharing class SObjectifyController {

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
        public String componentName { get; set; }
        @AuraEnabled
        public String componentType { get; set; }
    
        public FieldReferencesInfo(String name, String type) {
            this.componentName = name;
            this.componentType = type;
        }
    }

    @AuraEnabled(cacheable=true)
    public static List<SObjectInfo> getSObjectInfo() {
        List<SObjectInfo> sobjectList = new List<SObjectInfo>();
        
        Map<String, Schema.SObjectType> globalDescribe = Schema.getGlobalDescribe();
        for (String sObjectName : globalDescribe.keySet()) {
            Schema.DescribeSObjectResult sObjectTypeResult = globalDescribe.get(sObjectName).getDescribe();
            
            if(sObjectTypeResult.isAccessible() && !sObjectTypeResult.isDeprecatedAndHidden() && sObjectTypeResult.isDeletable()){
                SObjectInfo sSObjectInfo = new SObjectInfo(sObjectTypeResult.getLabel() + ' - (' + sObjectTypeResult.getName() + ')', sObjectTypeResult.getName());
                sobjectList.add(sSObjectInfo);
            }
        }
        
        return sobjectList;
    }

    @AuraEnabled(cacheable=true)
    public static List<FieldInfo> getFieldInfo(String sObjectName, String sObjectId) {
        Map<String, FieldInfo> fieldMapByDeveloperName = new Map<String, FieldInfo>();
        String objectResponseBody = '';
        
        Schema.SObjectType sObjectType = Schema.getGlobalDescribe().get(sObjectName);
        if (sObjectType != null) {
            Schema.DescribeSObjectResult describeResult = sObjectType.getDescribe();
            Map<String, Schema.SObjectField> fieldMap = describeResult.fields.getMap();
            
            for (String fieldName : fieldMap.keySet()) {
                Schema.DescribeFieldResult field = fieldMap.get(fieldName).getDescribe();
                
                //Add to field info
                FieldInfo fieldInfo = new FieldInfo(field.getName(), field.getLabel(), field.isCustom());
                fieldMapByDeveloperName.put(field.getName(), fieldInfo);
            }

            //Query the field definition tooling api
            String query = 'SELECT Id, DeveloperName from CustomField WHERE TableEnumOrId = \'' + (sObjectName.contains('__c') ? sObjectId : sObjectName) + '\'';
            HttpResponse response = ToolingAPIUtility.queryToolingAPI(query);
            CustomFieldToolingResponse toolingRes = (CustomFieldToolingResponse) JSON.deserializeStrict(response.getBody(), CustomFieldToolingResponse.class);
            if(toolingRes.size > 0){
                for (CustomFieldToolingResponse.Record rec : toolingRes.records) {
                    string fieldApiName = rec.DeveloperName + '__c';
                    if(fieldMapByDeveloperName.containsKey(fieldApiName)){
                        FieldInfo currentFieldInfo = fieldMapByDeveloperName.get(fieldApiName);
                        currentFieldInfo.fieldId = rec.Id;
                    }
                }
            }
        }
        return fieldMapByDeveloperName.values();
    }

    @AuraEnabled(cacheable=true)
    public static string getCustomSObjectId(string sObjectName){
        string returnValue = sObjectName;
        if(sObjectName.contains('__c')){
            String objectQuery = 'SELECT Id FROM CustomObject WHERE DeveloperName = \'' + sObjectName.replace('__c', '') + '\'';
            HttpResponse objectResponse = ToolingAPIUtility.queryToolingAPI(objectQuery);
            Map<String, Object> results = (Map<String, Object>) JSON.deserializeUntyped(objectResponse.getBody());
            List<Object> records = (List<Object>) results.get('records');
            Map<String, Object> record = (Map<String, Object>) records[0];
            returnValue = (string)record.get('Id');
            System.debug('Sobject Id ::: ' + returnValue);
        }

        return returnValue;
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
}
public with sharing class SObjectifyController {

    private static final string CUSTOM_EXTENSION = '__c';
    private static final string FIELDS_AND_RELATIONSHIPS_INFO = 'FieldsAndRelationships';
    private static final string PAGE_LAYOUTS_INFO = 'PageLayouts';
    private static final string RECORD_TYPES_INFO = 'RecordTypes';
    private static final string VALIDATION_RULES_INFO = 'ValidationRules';
    private static final string FLOWS_INFO = 'Flows';
    private static final string APEX_TRIGGERS_INFO = 'ApexTriggers';

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
        if (infoType == FIELDS_AND_RELATIONSHIPS_INFO) {
            return objectInfo.getFields();
        } else if (infoType == PAGE_LAYOUTS_INFO) {
            return objectInfo.getLayouts();
        } else if (infoType == RECORD_TYPES_INFO) {
            return objectInfo.getRecordTypes();
        } else if (infoType == APEX_TRIGGERS_INFO) {
            return objectInfo.getApexTriggers();
        } else {
            throw new IllegalArgumentException('Invalid infoType: ' + infoType);
        }
    }

    @AuraEnabled
    public static List<FieldReferencesInfo> getFieldReferences(String fieldId){
        List<FieldReferencesInfo> fieldRefs = new List<FieldReferencesInfo>();
        MetadataDependencyToolingResponse toolingRes = SObjectifyHelper.getMetadataDependecies(new List<string> { fieldId });
        if(toolingRes.size > 0){
            for(MetadataDependencyToolingResponse.Record rec : toolingRes.records){
                fieldRefs.add(new FieldReferencesInfo(rec.MetadataComponentName, rec.MetadataComponentType));
            }
        }
        return fieldRefs;
    }
}


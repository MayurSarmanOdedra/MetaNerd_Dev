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
        List<FieldInfo> fieldList = new List<FieldInfo>();
        
        Schema.SObjectType sObjectType = Schema.getGlobalDescribe().get(sObjectName);
        if (sObjectType != null) {
            Schema.DescribeSObjectResult describeResult = sObjectType.getDescribe();
            Map<String, Schema.SObjectField> fieldMap = describeResult.fields.getMap();
            
            for (String fieldName : fieldMap.keySet()) {
                Schema.DescribeFieldResult field = fieldMap.get(fieldName).getDescribe();
                String apiName = field.getName();
                String label = field.getLabel();
                Boolean isCustom = field.isCustom();
                
                FieldInfo fieldInfo = new FieldInfo(apiName, label, isCustom);
                fieldList.add(fieldInfo);
            }
        }
        
        System.debug('fields ::: ' + fieldList.toString());
        return fieldList;
    }
}
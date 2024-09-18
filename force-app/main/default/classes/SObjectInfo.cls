public inherited sharing class SObjectInfo {
    
    private string sObjectName;
    private string customSObjectId;
    private static final string CUSTOM_EXTENSION = '__c';
    private static final list<string> FLOW_PROCESS_TYPES = new list<string>{ 'AutoLaunchedFlow','CheckoutFlow','Flow' };
    private static final list<string> FLOW_TRIGGER_TYPES = new list<string>{ 'RecordBeforeSave', 'RecordAfterSave', 'RecordBeforeDelete' };

    private static SObjectInfo instance = null;

    //private constructor
    private SObjectInfo(string sObjectName) {
        this.sObjectName = string.escapeSingleQuotes(sObjectName);
    }

    public static SObjectInfo getInstance(string sObjectName){
        if(instance == null || instance.sObjectName != string.escapeSingleQuotes(sObjectName)){
            instance = new SObjectInfo(sObjectName);
        }
        return instance;
    }

    public string getCustomObjectId(){
        if(!sObjectName.endsWith(CUSTOM_EXTENSION)){  return sObjectName; }

        String objectQuery = 'SELECT Id FROM CustomObject WHERE DeveloperName = ' + stringWithSingleQuotes(sObjectName.replace(CUSTOM_EXTENSION, ''));
        HttpResponse objectResponse = ToolingAPIUtility.queryToolingAPI(objectQuery);
        Map<String, Object> results = (Map<String, Object>) JSON.deserializeUntyped(objectResponse.getBody());
        List<Object> records = (List<Object>) results.get('records');
        Map<String, Object> record = (Map<String, Object>) records[0];
        customSObjectId = (string)record.get('Id');
        return customSObjectId;
    }

    public Map<string, integer> getMetadataCountInfo() {
        Map<string, integer> info = new Map<string, integer>();
        info.put('FieldsAndRelationships', getFieldsCount());
        info.put('PageLayouts', getPageLayoutsCount());
        info.put('RecordTypes', getRecordTypesCount());
        info.put('ValidationRules', getValidationRulesCount());
        info.put('Flows', getFlowsCount());
        info.put('ApexTriggers', getTriggersCount());

        return info;
    }

    public List<FieldInfo> getFields(){
        Map<String, FieldInfo> fieldMapByDeveloperName = new Map<String, FieldInfo>();
        Map<String, Schema.SObjectField> fieldMap = Schema.getGlobalDescribe().get(sObjectName).getDescribe().fields.getMap();
        
        for (String fieldName : fieldMap.keySet()) {
            Schema.DescribeFieldResult field = fieldMap.get(fieldName).getDescribe();
            
            //Add to field info
            FieldInfo fieldInfo = FieldInfo.builder()
                                        .setApiName(field.getName())
                                        .setLabel(field.getLabel())
                                        .setIsCustom(field.isCustom());
            fieldMapByDeveloperName.put(field.getName(), fieldInfo);
        }

        //Query the field definition tooling api
        String query = 'SELECT Id, DeveloperName from CustomField WHERE EntityDefinition.QualifiedApiName = ' + stringWithSingleQuotes(sObjectName);
        List<object> toolingRecs = getToolingResponseRecords(ToolingAPIUtility.queryToolingAPI(query));
        if(toolingRecs.size() > 0){
            for (Object rec : toolingRecs) {
                Map<String, Object> recMap = (Map<String, Object>)rec;
                string fieldApiName = ((string) recMap.get('DeveloperName')) + CUSTOM_EXTENSION;
                if(fieldMapByDeveloperName.containsKey(fieldApiName)){
                    FieldInfo currentFieldInfo = fieldMapByDeveloperName.get(fieldApiName);
                    currentFieldInfo.setId((id) recMap.get('Id'));
                }
            }
        }
        return fieldMapByDeveloperName.values();
    }

    public List<LayoutInfo> getLayouts(){
        List<LayoutInfo> layouts = new List<LayoutInfo>();
        //Query the layouts using tooling api
        String query = 'SELECT Id, Name, LayoutType FROM Layout WHERE EntityDefinition.QualifiedApiName = ' + stringWithSingleQuotes(sObjectName);
        List<object> toolingRecs = getToolingResponseRecords(ToolingAPIUtility.queryToolingAPI(query));
        
        if(toolingRecs.size() > 0){
            for(Object rec : toolingRecs){
                Map<String, Object> recMap = (Map<String, Object>)rec;
                LayoutInfo layout = LayoutInfo.builder()
                                        .setId((string) recMap.get('Id'))
                                        .setLabel((string) recMap.get('Name'))
                                        .setType((string) recMap.get('LayoutType'));
                layouts.add(layout);
            } 
        }
        return layouts;
    }

    public List<RecordTypeInfo> getRecordTypes(){
        List<RecordTypeInfo> recordTypes = new List<RecordTypeInfo>();

        List<RecordType> records = [SELECT Id,Name,DeveloperName,Description,IsActive FROM RecordType WHERE SobjectType = :sObjectName];

        if(!records.isEmpty()){
            for(RecordType record : records){
                RecordTypeInfo recordTypeInfo = RecordTypeInfo.builder()
                                        .setId(record.Id)
                                        .setApiName(record.DeveloperName)
                                        .setLabel(record.Name)
                                        .setIsActive(record.IsActive)
                                        .setDescription(record.Description);
                recordTypes.add(recordTypeInfo);
            }
        }
        return recordTypes;
    }

    public void getValidationRules(){

    }

    public void getTriggers(){

    }

    private string stringWithSingleQuotes(string stringToConvert){
        return '\''+stringToConvert+'\'';
    } 

    private List<object> getToolingResponseRecords(HttpResponse response){
        Map<string, object> responseBody = (Map<string, object>)JSON.deserializeUntyped(response.getBody());
        return  (List<object>) responseBody.get('records');
    }

    private integer getFieldsCount(){
        return Schema.getGlobalDescribe().get(this.sObjectName).getDescribe().fields.getMap().values().size();
    } 

    private integer getPageLayoutsCount(){
        HttpResponse queryResponse = ToolingAPIUtility.queryToolingAPI('SELECT COUNT() FROM Layout WHERE EntityDefinition.QualifiedApiName = ' + stringWithSingleQuotes(sObjectName));
        return getCountFromToolingResponse(queryResponse);
    }

    private integer getRecordTypesCount(){
        return Database.countquery('SELECT COUNT() FROM RecordType WHERE sobjecttype = :sObjectName');
    }

    private integer getValidationRulesCount(){
        HttpResponse queryResponse = ToolingAPIUtility.queryToolingAPI('SELECT COUNT() FROM ValidationRule WHERE EntityDefinition.QualifiedApiName = ' + stringWithSingleQuotes(sObjectName));
        return getCountFromToolingResponse(queryResponse);
    }

    private integer getFlowsCount(){
        List<FlowDefinitionView> flows = [SELECT Id, ApiName 
                                        from FlowDefinitionView 
                                        where ProcessType IN :FLOW_PROCESS_TYPES 
                                        AND TriggerObjectOrEventId != null 
                                        AND TriggerType IN :FLOW_TRIGGER_TYPES 
                                        AND TriggerObjectOrEvent.QualifiedApiName = :sObjectName];
        return flows.size();
    }

    private integer getTriggersCount(){
        return Database.countQuery('SELECT COUNT() FROM ApexTrigger WHERE TableEnumOrId = :sObjectName');
    } 

    private integer getCountFromToolingResponse(HttpResponse response){
        Map<string, object> responseDeserialized = (Map<string, object>) JSON.deserializeUntyped(response.getBody());
        return (integer)responseDeserialized.get('size');
    }

}
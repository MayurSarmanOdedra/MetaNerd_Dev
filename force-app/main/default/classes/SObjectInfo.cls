public inherited sharing class SObjectInfo {
    
    private string sObjectName;
    private string customSObjectId;

    Map<string, integer> countInfo = new Map<string, integer>();
    private List<FieldInfo> thisFieldInfo = new List<FieldInfo>();
    private List<LayoutInfo> thisLayoutInfo = new List<LayoutInfo>();
    private List<RecordTypeInfo> thisRecordTypeInfo = new List<RecordTypeInfo>();
    private List<ValidationRuleInfo> thisValidationRuleInfo = new List<ValidationRuleInfo>();
    private List<FlowInfo> thisFlowInfo = new List<FlowInfo>();
    private List<TriggerInfo> thisTriggerInfo = new List<TriggerInfo>();

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

    private string stringWithSingleQuotes(string stringToConvert){
        return '\''+stringToConvert+'\'';
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
        if(countInfo.isEmpty()){
            countInfo.put('FieldsAndRelationships', getFieldsCount());
            countInfo.put('PageLayouts', getPageLayoutsCount());
            countInfo.put('RecordTypes', getRecordTypesCount());
            countInfo.put('ValidationRules', getValidationRulesCount());
            countInfo.put('Flows', getFlowsCount());
            countInfo.put('ApexTriggers', getTriggersCount());
        }
        return countInfo;
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
                                        FROM FlowDefinitionView 
                                        WHERE ProcessType IN :FLOW_PROCESS_TYPES 
                                        AND TriggerObjectOrEventId != null 
                                        AND TriggerType IN :FLOW_TRIGGER_TYPES 
                                        AND TriggerObjectOrEvent.QualifiedApiName = :sObjectName];

        Integer totalSize = flows.size();
        flows.clear();
        return totalSize;
    }

    private integer getTriggersCount(){
        return Database.countQuery('SELECT COUNT() FROM ApexTrigger WHERE TableEnumOrId = :sObjectName');
    } 

    private integer getCountFromToolingResponse(HttpResponse response){
        Map<string, object> responseDeserialized = (Map<string, object>) JSON.deserializeUntyped(response.getBody());
        Integer totalCount = (integer)responseDeserialized.get('size');
        //clear response
        responseDeserialized.clear();
        return totalCount;
    }

    public List<FieldInfo> getFields(){
        if(thisFieldInfo.isEmpty()){
            Map<String, FieldInfo> fieldMapByDeveloperName = new Map<String, FieldInfo>();
            List<string> customFieldIds = new List<string>();
            
            //organize info
            createFieldInfo(fieldMapByDeveloperName);
            setCustomFieldIds(fieldMapByDeveloperName, customFieldIds);
            //set unused fields only if theere are custom fields
            if(!customFieldIds.isEmpty()){
                setUnusedFields(fieldMapByDeveloperName, customFieldIds);
            }
            
            //assign to this object
            thisFieldInfo = fieldMapByDeveloperName.values();
            
            //clear values
            fieldMapByDeveloperName.clear();
            customFieldIds.clear();
        }
        
        return thisFieldInfo;
    }

    //helper for fieldInfo
    private void createFieldInfo(Map<string, FieldInfo> fieldMapByDeveloperName){
        Map<String, Schema.SObjectField> fieldMap = Schema.getGlobalDescribe().get(sObjectName).getDescribe().fields.getMap();
        for (String fieldName : fieldMap.keySet()) {
            Schema.DescribeFieldResult field = fieldMap.get(fieldName).getDescribe();
            
            //Add to field info
            FieldInfo fieldInfo = FieldInfo.builder(null, field.getName(), field.getLabel())
                                    .setIsCustom(field.isCustom());
            //Add to fields map
            fieldMapByDeveloperName.put(field.getName(), fieldInfo);
        }
        //clear fieldMap
        fieldMap.clear();
    }

    //helper for fieldInfo
    private void setCustomFieldIds(Map<string, FieldInfo> fieldMapByDeveloperName, List<string> customFieldIds){
         //Query the field definition tooling api
        String query = 'SELECT Id, DeveloperName from CustomField WHERE EntityDefinition.QualifiedApiName = ' + stringWithSingleQuotes(sObjectName);
        for (Object rec : getToolingResponseRecords(ToolingAPIUtility.queryToolingAPI(query))) {
            Map<String, Object> recMap = (Map<String, Object>)rec;
            string qualifiedApiName = ((string) recMap.get('DeveloperName')) + CUSTOM_EXTENSION;
            if(fieldMapByDeveloperName.containsKey(qualifiedApiName)){
                FieldInfo currentFieldInfo = fieldMapByDeveloperName.get(qualifiedApiName);
                Id recordId = (id) recMap.get('Id');
                currentFieldInfo.setId(recordId);
                customFieldIds.add(recordId);
            }
        }
    }

    //helper for fieldInfo
    private void setUnusedFields(Map<string, FieldInfo> fieldMapByDeveloperName, List<string> customFieldIds){
        try {
            for(MetadataDependencyToolingResponse.Record rec : (SObjectifyHelper.getMetadataDependecies(customFieldIds)).records){
                integer fieldIndex = customFieldIds.indexOf(rec.RefMetadataComponentId);
                if(fieldIndex != -1){
                    customFieldIds.remove(fieldIndex);
                }
            }

            for(FieldInfo f : fieldMapByDeveloperName.values()){
                f.setIsUnused(customFieldIds.contains(f.id) ? true : false);
            }
        } catch (Exception e) {
            throw new AuraHandledException(e.getMessage());
        }
    }

    public List<LayoutInfo> getLayouts(){
        if(thisLayoutInfo.isEmpty()){
            //Query the layouts using tooling api
            String query = 'SELECT Id, Name, LayoutType FROM Layout WHERE EntityDefinition.QualifiedApiName = ' + stringWithSingleQuotes(sObjectName);
            for(Object rec : getToolingResponseRecords(ToolingAPIUtility.queryToolingAPI(query))){
                Map<String, Object> recMap = (Map<String, Object>)rec;
                //extract id, name, and layouttype
                id id = (id) recMap.get('Id');
                string label = (string) recMap.get('Name');
                string type = (string) recMap.get('LayoutType');
                //add to layoutinfo list
                thisLayoutInfo.add(LayoutInfo.builder(id, label, label).setType(type));            
            }
        }
        return thisLayoutInfo;
    }

    public List<RecordTypeInfo> getRecordTypes(){
        if(thisRecordTypeInfo.isEmpty()){
            for(RecordType record : [SELECT Id,Name,DeveloperName,Description,IsActive FROM RecordType WHERE SobjectType = :sObjectName]){
                thisRecordTypeInfo.add(RecordTypeInfo.builder(record.Id, record.DeveloperName, record.Name)
                                            .setIsActive(record.IsActive)
                                            .setDescription(record.Description));
            }
        }
        return thisRecordTypeInfo;
    }

    public List<ValidationRuleInfo> getValidationRules(){
        if(thisValidationRuleInfo.isEmpty()){
            string query = 'SELECT Id, ValidationName, ErrorMessage, ErrorDisplayField, Active FROM ValidationRule WHERE EntityDefinition.QualifiedApiName = ' + stringWithSingleQuotes(sObjectName);
            for(Object rec : getToolingResponseRecords(ToolingAPIUtility.queryToolingAPI(query))){
                Map<String, Object> recMap = (Map<String, Object>)rec;
                //extract info
                id id = (id) recMap.get('Id');
                string label = (string) recMap.get('ValidationName');
                string errorMessage = (string) recMap.get('ErrorMessage');
                boolean isActive = (boolean) recMap.get('Active');
                string errorDisplayField = (string) recMap.get('ErrorDisplayField');
                //add to validationInfo
                thisValidationRuleInfo.add(ValidationRuleInfo.builder(id, label, label)
                                                .setIsActive(isActive)
                                                .setErrorMessage(errorMessage)
                                                .setErrorField(errorDisplayField));
            }
            system.debug(thisValidationRuleInfo);
        }
        return thisValidationRuleInfo;
    }

    public List<FlowInfo> getFlows(){
        if(thisFlowInfo.isEmpty()){
            Map<string, FlowInfo> flowInfoByDeveloperName = new Map<string, FlowInfo>();
            for(FlowDefinitionView flow : [SELECT DurableId, 
                                                  ApiName, 
                                                  Label, 
                                                  IsActive, 
                                                  ActiveVersionId,
                                                  VersionNumber
                                            FROM FlowDefinitionView
                                            WHERE TriggerObjectOrEvent.QualifiedApiName = :sObjectName
                                            AND ProcessType IN :FLOW_PROCESS_TYPES
                                            AND TriggerObjectOrEventId != null
                                            AND TriggerType IN :FLOW_TRIGGER_TYPES]){
                //add to map
                flowInfoByDeveloperName.put(flow.ApiName, FlowInfo.builder(flow.DurableId, flow.ApiName, Flow.Label)
                                                                  .setIsActive(flow.IsActive)
                                                                  .setActiveVersionId(flow.ActiveVersionId)
                                                                  .setActiveVersionNumber(flow.VersionNumber));
                                
            }

            if(flowInfoByDeveloperName.size() > 0){
                List<string> flowDeveloperNamesWithSingleQuotes = new List<string>();
                //loop through flowInfoByDeveloperName keyset and call the stringtosinglequotes method and store resutls into new list
                for(string flowString : flowInfoByDeveloperName.keySet()){
                    flowDeveloperNamesWithSingleQuotes.add(stringWithSingleQuotes(flowString));
                }
                string query = 'SELECT COUNT(Id) flowCount, Definition.DeveloperName FROM Flow WHERE Definition.DeveloperName IN (' + String.join(flowDeveloperNamesWithSingleQuotes, ',') + ') GROUP BY Definition.DeveloperName';
                System.debug('Fquery :: ' + query);
                for(Object rec : getToolingResponseRecords(ToolingAPIUtility.queryToolingAPI(query))){
                    Map<String, Object> recMap = (Map<String, Object>)rec;
                    //extract info
                    integer totalVersions = (integer) recMap.get('flowCount');
                    string flowDeveloperName = (string) recMap.get('DeveloperName');
                    //modified FlowInfo within map
                    flowInfoByDeveloperName.get(flowDeveloperName).setTotalVersions(totalVersions);
                }
            }
            //set flowinfo for return
            thisFlowInfo = flowInfoByDeveloperName.values();
            //clear maps
            flowInfoByDeveloperName.clear();
        }
        return thisFlowInfo;
    }

    public List<TriggerInfo> getApexTriggers(){
        if(thisTriggerInfo.isEmpty()){
            for(ApexTrigger t : [SELECT Id, 
                                    Name, 
                                    Status, 
                                    TableEnumOrId,  
                                    UsageBeforeInsert, 
                                    UsageAfterInsert, 
                                    UsageBeforeUpdate, 
                                    UsageAfterUpdate, 
                                    UsageBeforeDelete, 
                                    UsageAfterDelete,
                                    UsageAfterUndelete 
                            FROM ApexTrigger 
                            WHERE TableEnumOrId = :sObjectName]){
                List<string> triggerTypes = new List<string>();
                //Set Trigger Type logic
                if(t.UsageBeforeInsert){
                    triggerTypes.add('Before Insert');
                }

                if(t.UsageAfterInsert){
                    triggerTypes.add('After Insert');
                }

                if(t.UsageBeforeUpdate){
                    triggerTypes.add('Before Update');
                }

                if(t.UsageAfterUpdate){
                    triggerTypes.add('After Update');
                }

                if(t.UsageBeforeDelete){
                    triggerTypes.add('Before Delete');
                }

                if(t.UsageAfterDelete){
                    triggerTypes.add('After Delete');
                }

                if(t.UsageAfterUndelete){
                    triggerTypes.add('After Undelete');
                }

                thisTriggerInfo.add(TriggerInfo.builder(t.Id, t.Name, t.Name)
                                        .setIsActive(t.Status == 'Active' ? true : false)
                                        .setType(string.join(triggerTypes, ', ')));
            }
        }
        return thisTriggerInfo;
    }
}
public inherited sharing class RecordTypeInfo {
    
    @AuraEnabled
    public id id { get; set; }
    @AuraEnabled
    public string apiName { get; set; }
    @AuraEnabled
    public string label { get; set; }
    @AuraEnabled
    public boolean isActive { get; set; }  
    @AuraEnabled
    public string description { get; set; } 

    private RecordTypeInfo() {}

    public static RecordTypeInfo builder(){
        return new RecordTypeInfo();
    }

    public RecordTypeInfo setId(id recordTypeId){
        this.id = recordTypeId;
        return this;
    }

    public RecordTypeInfo setApiName(string apiName){
        this.apiName = apiName;
        return this;
    }

    public RecordTypeInfo setLabel(string label){
        this.label = label;
        return this;
    }

    public RecordTypeInfo setIsActive(boolean isActive){
        this.isActive = isActive;
        return this;
    }

    public RecordTypeInfo setDescription(string description){
        this.description = description;
        return this;
    }
}
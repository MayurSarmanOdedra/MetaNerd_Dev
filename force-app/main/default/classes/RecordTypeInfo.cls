public inherited sharing class RecordTypeInfo extends MetadataInfo {
    
    @AuraEnabled
    public boolean isActive { get; set; }  
    @AuraEnabled
    public string description { get; set; } 

    private RecordTypeInfo(id id, string apiName, string label) {
        super(id, apiName, label);
    }

    public static RecordTypeInfo builder(id id, string apiName, string label){
        return new RecordTypeInfo(id, apiName, label);
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
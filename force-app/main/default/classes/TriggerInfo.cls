public inherited sharing class TriggerInfo extends MetadataInfo {

    @AuraEnabled
    public boolean isActive { get; set; }
    @AuraEnabled
    public string type { get; set; }

    private TriggerInfo(id id, string apiName, string label) {
        super(id, apiName, label);
    }

    public static TriggerInfo builder(id id, string apiName, string label){
        return new TriggerInfo(id, apiName, label);
    }
    
    public TriggerInfo setIsActive(boolean isActive){
        this.isActive = isActive;
        return this;
    }

    public TriggerInfo setType(string type){
        this.type = type;
        return this;
    }
}

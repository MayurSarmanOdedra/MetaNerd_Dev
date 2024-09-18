public inherited sharing class TriggerInfo {
    
    @AuraEnabled
    public id id { get; set; }
    @AuraEnabled
    public string apiName { get; set; }
    @AuraEnabled
    public string label { get; set; }
    @AuraEnabled
    public boolean isActive { get; set; }
    @AuraEnabled
    public string type { get; set; }


    private TriggerInfo() {}

    public static TriggerInfo builder(){
        return new TriggerInfo();
    }

    public TriggerInfo setId(id triggerId){
        this.id = triggerId;
        return this;
    }

    public TriggerInfo setApiName(string apiName){
        this.apiName = apiName;
        return this;
    }

    public TriggerInfo setLabel(string label){
        this.label = label;
        return this;
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
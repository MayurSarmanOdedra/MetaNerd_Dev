public inherited sharing class FlowInfo extends MetadataInfo {
    
    @AuraEnabled
    public boolean isActive { get; set; }  
    @AuraEnabled
    public integer totalVersions { get; set; }  

    private FlowInfo(id id, string apiName, string label) {
        super(id, apiName, label);
    }

    public static FlowInfo builder(id id, string apiName, string label){
        return new FlowInfo(id, apiName, label);
    }

    public FlowInfo setIsActive(boolean isActive){
        this.isActive = isActive;
        return this;
    }

    public FlowInfo setTotalVersions(integer totalVersions){
        this.totalVersions = totalVersions;
        return this;
    }
}
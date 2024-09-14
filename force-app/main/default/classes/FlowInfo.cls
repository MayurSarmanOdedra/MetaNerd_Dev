public inherited sharing class FlowInfo {
    
    @AuraEnabled
    public id flowId { get; set; }
    @AuraEnabled
    public string apiName { get; set; }
    @AuraEnabled
    public string label { get; set; }
    @AuraEnabled
    public boolean isActive { get; set; }  
    @AuraEnabled
    public integer totalVersions { get; set; }  

    private FlowInfo() {}

    public static FlowInfo builder(){
        return new FlowInfo();
    }

    public FlowInfo setFlowId(id flowId){
        this.flowId = flowId;
        return this;
    }

    public FlowInfo setApiName(string apiName){
        this.apiName = apiName;
        return this;
    }

    public FlowInfo setLabel(string label){
        this.label = label;
        return this;
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
public inherited sharing class FieldInfo {
    @AuraEnabled
    public Id id { get; set; }
    @AuraEnabled
    public String apiName { get; set; }
    @AuraEnabled
    public String label { get; set; }
    @AuraEnabled
    public Boolean isCustom { get; set; }
    @AuraEnabled
    public Boolean isUnused { get; set; }

    private FieldInfo() {}

    public static FieldInfo builder(){
        return new FieldInfo();
    }

    public FieldInfo setId(Id fieldId){
        this.id = fieldId;
        return this;
    }

    public FieldInfo setApiName(string apiName){
        this.apiName = apiName;
        return this;
    }

    public FieldInfo setLabel(string label){
        this.label = label;
        return this;
    }

    public FieldInfo setIsCustom(boolean isCustom){
        this.isCustom = isCustom;
        return this;
    }

    public FieldInfo setIsUnused(boolean isUnused){
        this.isUnused = isUnused;
        return this;
    }
}
public inherited sharing class FieldInfo {
    @AuraEnabled
    public Id fieldId { get; set; }
    @AuraEnabled
    public String apiName { get; set; }
    @AuraEnabled
    public String label { get; set; }
    @AuraEnabled
    public Boolean isCustom { get; set; }

    private FieldInfo() {}

    public static FieldInfo builder(){
        return new FieldInfo();
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

    public FieldInfo setFieldId(Id fieldId){
        this.fieldId = fieldId;
        return this;
    }
}
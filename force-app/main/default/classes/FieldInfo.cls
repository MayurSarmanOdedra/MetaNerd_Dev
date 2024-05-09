public class FieldInfo {
    @AuraEnabled
    public Id fieldId { get; set; }
    @AuraEnabled
    public String apiName { get; set; }
    @AuraEnabled
    public String label { get; set; }
    @AuraEnabled
    public Boolean isCustom { get; set; }
    @AuraEnabled
    public Boolean isStandard { get { return !(this.isCustom);} }
    
    public FieldInfo(String apiName, String label, Boolean isCustom) {
        this.apiName = apiName;
        this.label = label;
        this.isCustom = isCustom;
    }

    public void setFieldId(Id fieldId){
        this.fieldId = fieldId;
    }
}

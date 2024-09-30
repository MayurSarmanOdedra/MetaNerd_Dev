public inherited sharing class ValidationRuleInfo extends MetadataInfo {

    @AuraEnabled
    public boolean isActive { get; set; }
    @AuraEnabled
    public string errorMessage { get; set; }
    @AuraEnabled
    public string errorField { get; set; }

    //private constructor
    private ValidationRuleInfo(id id, string apiName, string label) {
        super(id, apiName, label);
    }

    //public builder method
    public static ValidationRuleInfo builder(id id, string apiName, string label){
        return new ValidationRuleInfo(id, apiName, label);
    }

    //set isActive
    public ValidationRuleInfo setIsActive(boolean isActive){
        this.isActive = isActive;
        return this;
    }

    //set errorMessage
    public ValidationRuleInfo setErrorMessage(string errorMessage){
        this.errorMessage = errorMessage;
        return this;
    }

    //set errorField
    public ValidationRuleInfo setErrorField(string errorField){
        this.errorField = errorField;
        return this;
    }

}
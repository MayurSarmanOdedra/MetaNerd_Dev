public inherited sharing class FieldInfo extends MetadataInfo {
    @AuraEnabled
    public Boolean isCustom { get; set; }
    @AuraEnabled
    public Boolean isUnused { get; set; }

    private FieldInfo(id id, string apiName, string label) {
        super(id, apiName, label);
    }

    public static FieldInfo builder(id id, string apiName, string label){
        return new FieldInfo(id, apiName, label);
    }

    public FieldInfo setId(Id fieldId){
        super.setMetadataId(fieldId);
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
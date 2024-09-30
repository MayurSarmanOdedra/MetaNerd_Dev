public inherited sharing class LayoutInfo extends MetadataInfo {

    @AuraEnabled
    public string type { get; set; } 

    private LayoutInfo(id id, string apiName, string label) {
        super(id, apiName, label);
    }

    public static LayoutInfo builder(id id, string apiName, string label){
        return new LayoutInfo(id, apiName, label);
    }

    public LayoutInfo setType(string type){
        this.type = type;
        return this;
    }
}
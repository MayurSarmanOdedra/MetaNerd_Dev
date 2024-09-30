public abstract class MetadataInfo {
    
    @AuraEnabled
    public id id { get; set; }
    @AuraEnabled
    public string apiName { get; set; }
    @AuraEnabled
    public string label { get; set; }

    public MetadataInfo(id id, string apiName, string label){
        this.id = id;
        this.apiName = apiName;
        this.label = label;
    }

    public void setMetadataId(id id){
        this.id = id;
    }
}
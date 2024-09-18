public inherited sharing class LayoutInfo {

    @AuraEnabled
    public id id { get; set; }
    @AuraEnabled
    public string label { get; set; } 
    @AuraEnabled
    public string type { get; set; } 

    private LayoutInfo() {}

    public static LayoutInfo builder(){
        return new LayoutInfo();
    }

    public LayoutInfo setId(id layoutId){
        this.id = layoutId;
        return this;
    }

    public LayoutInfo setLabel(string label){
        this.label = label;
        return this;
    }

    public LayoutInfo setType(string type){
        this.type = type;
        return this;
    }

}
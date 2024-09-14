public inherited sharing class LayoutInfo {

    @AuraEnabled
    public id layoutId { get; set; }
    @AuraEnabled
    public string label { get; set; } 
    @AuraEnabled
    public string type { get; set; } 

    private LayoutInfo() {}

    public static LayoutInfo builder(){
        return new LayoutInfo();
    }

    public LayoutInfo setLayoutId(id layoutId){
        this.layoutId = layoutId;
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
public class SObjectInfo {
    @AuraEnabled
    public String label { get; set; }
    @AuraEnabled
    public String value { get; set; }
    
    public SObjectInfo(String label, String value) {
        this.label = label;
        this.value = value;
    }
}
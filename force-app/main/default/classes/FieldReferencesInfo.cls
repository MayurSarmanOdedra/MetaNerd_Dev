public class FieldReferencesInfo {
    @AuraEnabled
    public String componentName { get; set; }
    @AuraEnabled
    public String componentType { get; set; }

    public FieldReferencesInfo(String name, String type) {
        this.componentName = name;
        this.componentType = type;
    }
}
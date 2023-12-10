public class CustomFieldToolingResponse extends ToolingResponse {
    public List<Record> records;
    
    public class Record {
        public String Id;
        public String DeveloperName;
        public Attributes attributes;
    }
}
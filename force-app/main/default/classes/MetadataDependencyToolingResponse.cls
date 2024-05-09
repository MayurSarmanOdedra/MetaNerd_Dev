public class MetadataDependencyToolingResponse extends ToolingResponse {
    public List<Record> records;
    
    public class Record {
        public String MetadataComponentType;
        public String MetadataComponentName;
        public Attributes attributes;
    }
}
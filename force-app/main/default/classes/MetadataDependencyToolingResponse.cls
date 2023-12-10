public class MetadataDependencyToolingResponse extends ToolingResponse {
    public List<Record> records;
    
    public class Record {
        public String RefMetadataComponentId;
        public Attributes attributes;
    }
}
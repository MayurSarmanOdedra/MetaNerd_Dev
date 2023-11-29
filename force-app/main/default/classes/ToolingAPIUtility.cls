public without sharing class ToolingAPIUtility {
    
    public static HttpResponse queryToolingAPI(String query) {
        
        String urlString = 'callout:MetaNerd_Cred?q=' + EncodingUtil.urlEncode(query, 'UTF-8');

        HttpRequest request = new HttpRequest();
        
        request.setEndpoint(urlString);
        request.setMethod('GET');
        request.setHeader('Authorization', 'Bearer ' + UserInfo.getSessionId());
        
        Http http = new Http();
        HttpResponse response = http.send(request);
        
        System.debug(request.getEndpoint());
        return response;
    }
}
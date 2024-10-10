public without sharing class ToolingAPIUtility {
    
    public static HttpResponse queryToolingAPI(String query) {
        String urlString = 'callout:MetaNerd_Cred/query/?q=' + EncodingUtil.urlEncode(query, 'UTF-8');
        return getToolingAPIResponse(urlString, 'GET');
    }

    public static HttpResponse flowDeleteQuery(id flowId){
        string urlString = 'callout:MetaNerd_Cred/sobjects/Flow/' + string.escapeSingleQuotes(flowId);
        return getToolingAPIResponse(urlString, 'DELETE');
    }

    private static HttpResponse getToolingAPIResponse(string urlString, string method){
        HttpRequest request = new HttpRequest();
        
        request.setEndpoint(urlString);
        request.setMethod(method);
        request.setHeader('Authorization', 'Bearer ' + UserInfo.getSessionId());

        return new Http().send(request);
    }
}